/************************************************************
         BSF LARVAE MONITORING SYSTEM (MQTT VERSION)

OPTION 3 CONTROL LOGIC:
- AUTO   → Full automatic control
- MANUAL → Manual mode for 5 minutes
- ON/OFF → Works only in MANUAL mode
- AUTO resumes after timeout

*************************************************************/

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <SPIFFS.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>


// ───────────────── WIFI ─────────────────
const char* WIFI_SSID = "kamesh";
const char* WIFI_PASSWORD = "6205648562";

// ───────────────── MQTT ─────────────────
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "bsf-phase1-esp32";

// ───────────────── DEVICE ─────────────────
const char* DEVICE_ID = "BSF_001";
const char* LOCATION = "Lab_Rack_1";

// ───────────────── PINS ─────────────────
#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define RELAY_FAN 17

// ───────────────── TOPICS ─────────────────
const char* TOPIC_TEMPERATURE = "biopod/bsf/sensors/temperature";
const char* TOPIC_HUMIDITY    = "biopod/bsf/sensors/humidity";
const char* TOPIC_AIR_QUALITY = "biopod/bsf/sensors/air_quality";
const char* TOPIC_FAN_STATUS  = "biopod/bsf/status/fan";
const char* TOPIC_STATUS      = "biopod/bsf/status/online";
const char* TOPIC_FAN_CONTROL = "biopod/bsf/control/fan";

// ───────────────── OBJECTS ─────────────────
DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// ───────────────── SENSOR DATA ─────────────────
float temperature = 0;
float humidity = 0;
int airQuality = 0;

// ───────────────── CONTROL STATE ─────────────────
bool fanState = false;
bool ACTIVE_LOW = true;

bool fanManualMode = false;
int manualFan = 0;
unsigned long manualModeStart = 0;

// ───────────────── THRESHOLDS ─────────────────
float TEMP_THRESHOLD_ON  = 29.0;
float TEMP_THRESHOLD_OFF = 28.0;

int MQ_THRESHOLD_HIGH = 1800;
int MQ_THRESHOLD_LOW  = 1600;

const unsigned long MANUAL_MODE_TIMEOUT = 300000; // 5 minutes

// ───────────────── TIMERS ─────────────────
unsigned long lastSensorRead = 0;
unsigned long lastMQTTPublish = 0;

// ───────────────── RELAY ─────────────────
void relayOn() {
  digitalWrite(RELAY_FAN, ACTIVE_LOW ? LOW : HIGH);
  fanState = true;
  Serial.println("[RELAY] FAN ON");
}

void relayOff() {
  digitalWrite(RELAY_FAN, ACTIVE_LOW ? HIGH : LOW);
  fanState = false;
  Serial.println("[RELAY] FAN OFF");
}

// ───────────────── WIFI ─────────────────
void setupWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected");
}

// ───────────────── MQTT CALLBACK ─────────────────
// void mqttCallback(char* topic, byte* payload, unsigned int length) {

//   DynamicJsonDocument doc(256);
//   if (deserializeJson(doc, payload, length)) {
//     Serial.println("[MQTT] JSON Error");
//     return;
//   }

//   const char* command = doc["command"];
//   Serial.printf("[MQTT] Command: %s\n", command);

//   // AUTO MODE
//   if (strcmp(command, "AUTO") == 0) {
//     fanManualMode = false;
//     Serial.println("[CONTROL] AUTO MODE ENABLED");
//     return;
//   }

//   // MANUAL MODE
//   if (strcmp(command, "MANUAL") == 0) {
//     fanManualMode = true;
//     manualModeStart = millis();
//     Serial.println("[CONTROL] MANUAL MODE ENABLED (5 min)");
//     return;
//   }

//   // ON / OFF only works in MANUAL
//   if (fanManualMode) {
//     if (strcmp(command, "ON") == 0) {
//       manualFan = 1;
//       Serial.println("[CONTROL] MANUAL FAN ON");
//     }
//     else if (strcmp(command, "OFF") == 0) {
//       manualFan = 0;
//       Serial.println("[CONTROL] MANUAL FAN OFF");
//     }
//   } else {
//     Serial.println("[CONTROL] Ignored (not in MANUAL)");
//   }
// }

// ───────────────── MQTT CALLBACK ─────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {

  DynamicJsonDocument doc(256);
  if (deserializeJson(doc, payload, length)) {
    Serial.println("[MQTT] JSON Error");
    return;
  }

  // Try both formats (old "command" and new "state")
  const char* command = doc["command"] | doc["state"];
  const char* mode = doc["mode"] | "";
  
  Serial.printf("[MQTT] Received - Command: %s, Mode: %s\n", command, mode);

  // AUTO MODE (from backend or explicit command)
  if (strcmp(command, "AUTO") == 0 || strcmp(mode, "AUTO") == 0) {
    fanManualMode = false;
    Serial.println("[CONTROL] ✅ AUTO MODE ENABLED");
    return;
  }

  // MANUAL MODE (activate manual control for 5 minutes)
  if (strcmp(mode, "MANUAL") == 0) {
    fanManualMode = true;
    manualModeStart = millis();
    Serial.println("[CONTROL] ✅ MANUAL MODE ACTIVATED (5 min timeout)");
  }

  // ON / OFF commands (works in MANUAL mode)
  if (fanManualMode) {
    if (strcmp(command, "ON") == 0) {
      manualFan = 1;
      Serial.println("[CONTROL] 💡 MANUAL FAN ON");
      relayOn();
    }
    else if (strcmp(command, "OFF") == 0) {
      manualFan = 0;
      Serial.println("[CONTROL] 💡 MANUAL FAN OFF");
      relayOff();
    }
  } else {
    if (strcmp(command, "ON") == 0 || strcmp(command, "OFF") == 0) {
      Serial.println("[CONTROL] ⚠️  Ignored: Not in MANUAL mode. Switch to MANUAL first.");
    }
  }

  // Publish status back
  publishData();
}


// ───────────────── MQTT SETUP ─────────────────
void setupMQTT() {
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
}

// ───────────────── MQTT CONNECT ─────────────────
void connectMQTT() {
  while (!client.connected()) {
    Serial.print("[MQTT] Connecting...");
    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("Connected");
      client.subscribe(TOPIC_FAN_CONTROL);
    } else {
      delay(3000);
    }
  }
}

// ───────────────── SENSOR READ ─────────────────
void readSensors() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  airQuality = analogRead(MQ135_PIN);

  Serial.printf("[SENSOR] T=%.2f H=%.2f MQ=%d\n",
                temperature, humidity, airQuality);
}

// ───────────────── FAN LOGIC ─────────────────
// void updateFanControl() {

//   // Manual timeout
//   if (fanManualMode && millis() - manualModeStart > MANUAL_MODE_TIMEOUT) {
//     fanManualMode = false;
//     Serial.println("[CONTROL] MANUAL TIMEOUT → AUTO");
//   }

//   // MANUAL MODE (AUTO BLOCKED)
//   if (fanManualMode) {
//     manualFan ? relayOn() : relayOff();
//     return;
//   }

//   // AUTO MODE
//   if (temperature >= TEMP_THRESHOLD_ON || airQuality > MQ_THRESHOLD_HIGH) {
//     relayOn();
//   }
//   else if (temperature <= TEMP_THRESHOLD_OFF && airQuality < MQ_THRESHOLD_LOW) {
//     relayOff();
//   }
// }

// ───────────────── FAN LOGIC ─────────────────
void updateFanControl() {

  // Check manual timeout
  if (fanManualMode && (millis() - manualModeStart > MANUAL_MODE_TIMEOUT)) {
    fanManualMode = false;
    manualFan = 0;
    Serial.println("[CONTROL] ⏱️  MANUAL TIMEOUT → Reverting to AUTO");
  }

  // MANUAL MODE (AUTO control is BLOCKED)
  if (fanManualMode) {
    if (manualFan == 1) {
      relayOn();
    } else {
      relayOff();
    }
    return; // Don't run auto logic
  }

  // AUTO MODE (automatic temperature control)
  if (temperature >= TEMP_THRESHOLD_ON || airQuality > MQ_THRESHOLD_HIGH) {
    if (!fanState) { // Only turn on if currently off
      relayOn();
      Serial.println("[AUTO] FAN ON (High temp/air quality)");
    }
  }
  else if (temperature <= TEMP_THRESHOLD_OFF && airQuality < MQ_THRESHOLD_LOW) {
    if (fanState) { // Only turn off if currently on
      relayOff();
      Serial.println("[AUTO] FAN OFF (Normal conditions)");
    }
  }
}


// ───────────────── MQTT PUBLISH ─────────────────
void publishData() {

  DynamicJsonDocument doc(256);
  doc["device"] = DEVICE_ID;
  doc["temp"] = temperature;
  doc["humidity"] = humidity;
  doc["mq135"] = airQuality;
  doc["fan"] = fanState ? "ON" : "OFF";
  doc["mode"] = fanManualMode ? "MANUAL" : "AUTO";

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish(TOPIC_FAN_STATUS, buffer);
}

// ───────────────── SETUP ─────────────────
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_FAN, OUTPUT);
  relayOff();

  dht.begin();
  setupWiFi();
  setupMQTT();
}

// ───────────────── LOOP ─────────────────
void loop() {

  if (!client.connected()) connectMQTT();
  client.loop();

  if (millis() - lastSensorRead > 1000) {
    lastSensorRead = millis();
    readSensors();
    updateFanControl();
  }

  if (millis() - lastMQTTPublish > 30000) {
    lastMQTTPublish = millis();
    publishData();
  }
}
