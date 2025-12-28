═══════════════════════════════════════════════════════════════════════════════
PHASE 2: ARDUINO CODE FOR BSF SYSTEM (MQTT VERSION)
═══════════════════════════════════════════════════════════════════════════════

⏱️  TIME: 30 minutes
📍 ACTION: Create & upload new Arduino code

═══════════════════════════════════════════════════════════════════════════════
FILE: bsf_mqtt_v2.ino
═══════════════════════════════════════════════════════════════════════════════

COPY THIS ENTIRE CODE into your Arduino IDE:

────────────────────────────────────────────────────────────────────────────────

/************************************************************
         BSF LARVAE MONITORING SYSTEM (MQTT VERSION)
         
Hardware:
  - ESP32 Dev Board
  - DHT22 (Temperature & Humidity) on GPIO 4
  - MQ135 (Air Quality) on GPIO 34
  - Relay (Fan control) on GPIO 17
  
Features:
  - MQTT publishing every 30 seconds
  - Manual fan control with 5-minute timeout
  - Auto fan control based on MQ135 threshold
  - Hysteresis logic (1600-1800)
  - CSV logging (offline backup)
  - JSON formatted MQTT messages
  
Created: December 27, 2025
Previous: Blynk v1
Current: MQTT v2

*************************************************************/


#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <SPIFFS.h>


// ═════════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════


// WiFi Configuration
const char* WIFI_SSID = "kamesh";
const char* WIFI_PASSWORD = "6205648562";


// MQTT Configuration
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "bsf-phase1-esp32";
const char* MQTT_USERNAME = "";
const char* MQTT_PASSWORD = "";


// Device Identification
const char* DEVICE_ID = "BSF_001";
const char* LOCATION = "Lab_Rack_1";


// ═════════════════════════════════════════════════════════════════════════════
// 🔌 PIN CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════


#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define RELAY_FAN 17


// ═════════════════════════════════════════════════════════════════════════════
// 📡 MQTT TOPICS
// ═════════════════════════════════════════════════════════════════════════════


// Publishing topics (ESP32 sends data)
const char* TOPIC_TEMPERATURE = "biopod/bsf/sensors/temperature";
const char* TOPIC_HUMIDITY = "biopod/bsf/sensors/humidity";
const char* TOPIC_AIR_QUALITY = "biopod/bsf/sensors/air_quality";
const char* TOPIC_FAN_STATUS = "biopod/bsf/status/fan";
const char* TOPIC_STATUS = "biopod/bsf/status/online";

// Subscribing topics (receive commands from backend)
const char* TOPIC_FAN_CONTROL = "biopod/bsf/control/fan";
const char* TOPIC_SETTINGS = "biopod/bsf/settings/thresholds";


// ═════════════════════════════════════════════════════════════════════════════
// 🔧 OBJECT INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════════


DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);


// ═════════════════════════════════════════════════════════════════════════════
// 📊 VARIABLES - SENSOR DATA
// ═════════════════════════════════════════════════════════════════════════════


float temperature = 0;
float humidity = 0;
int airQuality = 0;


// ═════════════════════════════════════════════════════════════════════════════
// 🎛️ VARIABLES - CONTROL STATE
// ═════════════════════════════════════════════════════════════════════════════


bool fanState = false;            // Current fan state (on/off)
bool ACTIVE_LOW = true;           // Relay logic (true = LOW = ON)


// Manual control
int manualFan = 0;                // Manual command (1=ON, 0=OFF)
bool fanManualMode = false;       // Are we in manual mode?
unsigned long manualModeStart = 0; // When manual mode started


// Thresholds
int MQ_THRESHOLD_HIGH = 1800;     // Air quality to turn ON
int MQ_THRESHOLD_LOW = 1600;      // Air quality to turn OFF
int MANUAL_MODE_TIMEOUT = 300000; // 5 minutes in milliseconds


// ═════════════════════════════════════════════════════════════════════════════
// ⏱️ VARIABLES - TIMING
// ═════════════════════════════════════════════════════════════════════════════


unsigned long lastSensorRead = 0;     // Last sensor read time
unsigned long lastMQTTPublish = 0;    // Last MQTT publish time
unsigned long lastLogTime = 0;        // Last CSV log time
unsigned long lastWiFiCheck = 0;      // Last WiFi check time
unsigned long lastMQTTConnect = 0;    // Last MQTT connect attempt


// ═════════════════════════════════════════════════════════════════════════════
// ⚡ RELAY HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════


void relayOn(int pin) {
  digitalWrite(pin, ACTIVE_LOW ? LOW : HIGH);
  fanState = true;
  Serial.println("[RELAY] ✅ Fan ON");
}


void relayOff(int pin) {
  digitalWrite(pin, ACTIVE_LOW ? HIGH : LOW);
  fanState = false;
  Serial.println("[RELAY] ✅ Fan OFF");
}


// ═════════════════════════════════════════════════════════════════════════════
// 🌐 WIFI SETUP & CONNECT
// ═════════════════════════════════════════════════════════════════════════════


void setupWiFi() {
  Serial.println("");
  Serial.println("═══════════════════════════════════════════════════════════════");
  Serial.println("🌐 WIFI Connection");
  Serial.println("═══════════════════════════════════════════════════════════════");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println("");
  
  if (WiFi.isConnected()) {
    Serial.println("[WiFi] ✅ Connected!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("[WiFi] ⚠️  Connection failed - continuing in offline mode");
  }
  
  Serial.println("═══════════════════════════════════════════════════════════════");
  Serial.println("");
}


// ═════════════════════════════════════════════════════════════════════════════
// 🔌 MQTT CALLBACK - Handle incoming messages
// ═════════════════════════════════════════════════════════════════════════════


void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] 📨 Message received on topic: ");
  Serial.println(topic);
  
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("[MQTT] Payload: ");
  Serial.println(message);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handle Fan Control (biopod/bsf/control/fan)
  // ─────────────────────────────────────────────────────────────────────────
  if (strcmp(topic, TOPIC_FAN_CONTROL) == 0) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
      Serial.println("[MQTT] ❌ JSON parse failed!");
      return;
    }
    
    const char* command = doc["command"];
    
    if (strcmp(command, "ON") == 0) {
      manualFan = 1;
      fanManualMode = true;
      manualModeStart = millis();
      Serial.println("[CONTROL] 🎛️ Manual FAN ON (5-minute timeout active)");
    }
    else if (strcmp(command, "OFF") == 0) {
      manualFan = 0;
      fanManualMode = true;
      manualModeStart = millis();
      Serial.println("[CONTROL] 🎛️ Manual FAN OFF (5-minute timeout active)");
    }
    else if (strcmp(command, "AUTO") == 0) {
      fanManualMode = false;
      Serial.println("[CONTROL] 🔄 Returned to AUTO mode");
    }
  }
  
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handle Settings Update (biopod/bsf/settings/thresholds)
  // ─────────────────────────────────────────────────────────────────────────
  if (strcmp(topic, TOPIC_SETTINGS) == 0) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
      Serial.println("[MQTT] ❌ JSON parse failed!");
      return;
    }
    
    if (doc.containsKey("mq_high")) {
      MQ_THRESHOLD_HIGH = doc["mq_high"];
      Serial.print("[SETTINGS] MQ High threshold updated: ");
      Serial.println(MQ_THRESHOLD_HIGH);
    }
    
    if (doc.containsKey("mq_low")) {
      MQ_THRESHOLD_LOW = doc["mq_low"];
      Serial.print("[SETTINGS] MQ Low threshold updated: ");
      Serial.println(MQ_THRESHOLD_LOW);
    }
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 🔌 MQTT SETUP
// ═════════════════════════════════════════════════════════════════════════════


void setupMQTT() {
  Serial.println("");
  Serial.println("═══════════════════════════════════════════════════════════════");
  Serial.println("🔌 MQTT Setup");
  Serial.println("═══════════════════════════════════════════════════════════════");
  
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  
  Serial.print("[MQTT] Broker: ");
  Serial.println(MQTT_SERVER);
  Serial.print("[MQTT] Port: ");
  Serial.println(MQTT_PORT);
  Serial.print("[MQTT] Client ID: ");
  Serial.println(MQTT_CLIENT_ID);
  
  Serial.println("═══════════════════════════════════════════════════════════════");
  Serial.println("");
}


// ═════════════════════════════════════════════════════════════════════════════
// 🔌 MQTT CONNECT
// ═════════════════════════════════════════════════════════════════════════════


void connectMQTT() {
  if (client.connected()) {
    return;
  }
  
  if (millis() - lastMQTTConnect < 5000) {
    return; // Don't retry too frequently
  }
  
  lastMQTTConnect = millis();
  
  Serial.print("[MQTT] 🔄 Connecting...");
  
  if (client.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(" ✅ Connected!");
    
    // Subscribe to control topics
    client.subscribe(TOPIC_FAN_CONTROL);
    client.subscribe(TOPIC_SETTINGS);
    
    Serial.println("[MQTT] ✅ Subscribed to:");
    Serial.print("[MQTT]   - ");
    Serial.println(TOPIC_FAN_CONTROL);
    Serial.print("[MQTT]   - ");
    Serial.println(TOPIC_SETTINGS);
    
    // Publish online status
    publishOnlineStatus();
    
  } else {
    Serial.print(" ❌ Failed, rc=");
    Serial.print(client.state());
    Serial.println(" (retrying in 5 sec)");
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 📤 PUBLISH - Online Status
// ═════════════════════════════════════════════════════════════════════════════


void publishOnlineStatus() {
  if (!client.connected()) {
    return;
  }
  
  DynamicJsonDocument statusDoc(256);
  statusDoc["device"] = DEVICE_ID;
  statusDoc["location"] = LOCATION;
  statusDoc["status"] = "online";
  statusDoc["timestamp"] = millis();
  
  char statusBuffer[256];
  serializeJson(statusDoc, statusBuffer);
  
  client.publish(TOPIC_STATUS, statusBuffer);
  Serial.println("[MQTT] 📤 Online status published");
}


// ═════════════════════════════════════════════════════════════════════════════
// 📊 READ SENSORS
// ═════════════════════════════════════════════════════════════════════════════


void readSensors() {
  // Read DHT22
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Read MQ135 (analog)
  airQuality = analogRead(MQ135_PIN);
  
  // Check for valid readings
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[SENSOR] ❌ DHT22 read error!");
    return;
  }
  
  Serial.printf("[SENSOR] 🌡️ Temp: %.2f°C | 💧 Humidity: %.2f%% | 💨 MQ135: %d\n",
                temperature, humidity, airQuality);
}


// ═════════════════════════════════════════════════════════════════════════════
// 📤 PUBLISH - All Sensor Data
// ═════════════════════════════════════════════════════════════════════════════


void publishSensorData() {
  if (!client.connected()) {
    return;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // Publish Temperature
  // ─────────────────────────────────────────────────────────────────────────
  {
    DynamicJsonDocument tempDoc(256);
    tempDoc["device"] = DEVICE_ID;
    tempDoc["value"] = temperature;
    tempDoc["unit"] = "°C";
    tempDoc["timestamp"] = millis();
    
    char tempBuffer[256];
    serializeJson(tempDoc, tempBuffer);
    client.publish(TOPIC_TEMPERATURE, tempBuffer);
  }
  
  delay(50);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Publish Humidity
  // ─────────────────────────────────────────────────────────────────────────
  {
    DynamicJsonDocument humidityDoc(256);
    humidityDoc["device"] = DEVICE_ID;
    humidityDoc["value"] = humidity;
    humidityDoc["unit"] = "%";
    humidityDoc["timestamp"] = millis();
    
    char humidityBuffer[256];
    serializeJson(humidityDoc, humidityBuffer);
    client.publish(TOPIC_HUMIDITY, humidityBuffer);
  }
  
  delay(50);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Publish Air Quality (MQ135)
  // ─────────────────────────────────────────────────────────────────────────
  {
    DynamicJsonDocument aqDoc(256);
    aqDoc["device"] = DEVICE_ID;
    aqDoc["value"] = airQuality;
    aqDoc["unit"] = "ppm";
    aqDoc["timestamp"] = millis();
    
    char aqBuffer[256];
    serializeJson(aqDoc, aqBuffer);
    client.publish(TOPIC_AIR_QUALITY, aqBuffer);
  }
  
  delay(50);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Publish Fan Status
  // ─────────────────────────────────────────────────────────────────────────
  {
    DynamicJsonDocument fanDoc(256);
    fanDoc["device"] = DEVICE_ID;
    fanDoc["state"] = fanState ? "ON" : "OFF";
    fanDoc["mode"] = fanManualMode ? "MANUAL" : "AUTO";
    fanDoc["timestamp"] = millis();
    
    char fanBuffer[256];
    serializeJson(fanDoc, fanBuffer);
    client.publish(TOPIC_FAN_STATUS, fanBuffer);
  }
  
  Serial.println("[MQTT] 📤 All sensor data published");
}


// ═════════════════════════════════════════════════════════════════════════════
// 💾 LOG TO CSV (OFFLINE BACKUP)
// ═════════════════════════════════════════════════════════════════════════════


void logToCSV() {
  if (!SPIFFS.begin(true)) {
    Serial.println("[CSV] ❌ SPIFFS failed!");
    return;
  }
  
  File file = SPIFFS.open("/bsf_datalog.csv", FILE_APPEND);
  if (!file) {
    Serial.println("[CSV] ❌ Error opening file!");
    return;
  }
  
  // Format: timestamp,temp,humidity,mq135,fan_state,mode
  file.printf("%lu,%.2f,%.2f,%d,%s,%s\n",
              millis(),
              temperature,
              humidity,
              airQuality,
              fanState ? "ON" : "OFF",
              fanManualMode ? "MANUAL" : "AUTO");
  
  file.close();
  Serial.println("[CSV] 💾 Data logged to SPIFFS");
}


// ═════════════════════════════════════════════════════════════════════════════
// 🎛️ FAN CONTROL LOGIC
// ═════════════════════════════════════════════════════════════════════════════


void updateFanControl() {
  
  // ─────────────────────────────────────────────────────────────────────────
  // Auto-reset manual mode after 5 minutes
  // ─────────────────────────────────────────────────────────────────────────
  if (fanManualMode && (millis() - manualModeStart > MANUAL_MODE_TIMEOUT)) {
    fanManualMode = false;
    Serial.println("[CONTROL] ⏱️ Manual mode timeout → AUTO mode");
  }
  
  
  // ─────────────────────────────────────────────────────────────────────────
  // MANUAL MODE - Respond to manual commands
  // ─────────────────────────────────────────────────────────────────────────
  if (fanManualMode) {
    if (manualFan == 1) {
      relayOn(RELAY_FAN);
    } else {
      relayOff(RELAY_FAN);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // AUTO MODE - Hysteresis logic
  // ─────────────────────────────────────────────────────────────────────────
  else {
    if (airQuality > MQ_THRESHOLD_HIGH) {
      relayOn(RELAY_FAN);
    }
    else if (airQuality < MQ_THRESHOLD_LOW) {
      relayOff(RELAY_FAN);
    }
    // Between thresholds: no change (hysteresis prevents flickering)
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 🚀 SETUP
// ═════════════════════════════════════════════════════════════════════════════


void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("");
  Serial.println("╔═══════════════════════════════════════════════════════════════╗");
  Serial.println("║                                                               ║");
  Serial.println("║     BSF LARVAE MONITORING SYSTEM (MQTT - PHASE 2)            ║");
  Serial.println("║                                                               ║");
  Serial.println("║     - Temperature & Humidity Monitoring                       ║");
  Serial.println("║     - Air Quality Control                                     ║");
  Serial.println("║     - Automatic Fan Management                                ║");
  Serial.println("║     - MQTT Integration                                        ║");
  Serial.println("║                                                               ║");
  Serial.println("╚═══════════════════════════════════════════════════════════════╝");
  Serial.println("");
  
  // Initialize DHT22
  dht.begin();
  Serial.println("[DHT22] ✅ Initialized on GPIO 4");
  
  // Initialize Relay
  pinMode(RELAY_FAN, OUTPUT);
  relayOff(RELAY_FAN);
  Serial.println("[RELAY] ✅ Initialized on GPIO 17");
  
  // Initialize WiFi
  setupWiFi();
  
  // Initialize MQTT
  setupMQTT();
  
  Serial.println("[SYSTEM] 🚀 Initialization complete - starting main loop");
  Serial.println("");
}


// ═════════════════════════════════════════════════════════════════════════════
// 🔄 MAIN LOOP
// ═════════════════════════════════════════════════════════════════════════════


void loop() {
  unsigned long now = millis();
  
  // ═════════════════════════════════════════════════════════════════════════
  // WiFi Connection Check (every 10 seconds)
  // ═════════════════════════════════════════════════════════════════════════
  if (now - lastWiFiCheck >= 10000) {
    lastWiFiCheck = now;
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] ⚠️ Lost connection - reconnecting...");
      WiFi.reconnect();
    }
  }
  
  
  // ═════════════════════════════════════════════════════════════════════════
  // MQTT Connection Maintain
  // ═════════════════════════════════════════════════════════════════════════
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  
  // ═════════════════════════════════════════════════════════════════════════
  // Read Sensors (every 1 second)
  // ═════════════════════════════════════════════════════════════════════════
  if (now - lastSensorRead >= 1000) {
    lastSensorRead = now;
    
    readSensors();
    updateFanControl();
    
    // ───────────────────────────────────────────────────────────────────────
    // Log to CSV every 5 seconds
    // ───────────────────────────────────────────────────────────────────────
    if (now - lastLogTime >= 5000) {
      lastLogTime = now;
      logToCSV();
    }
  }
  
  
  // ═════════════════════════════════════════════════════════════════════════
  // Publish to MQTT (every 30 seconds)
  // ═════════════════════════════════════════════════════════════════════════
  if (now - lastMQTTPublish >= 30000) {
    lastMQTTPublish = now;
    
    if (client.connected()) {
      publishSensorData();
    }
  }
}

/*
═══════════════════════════════════════════════════════════════════════════════
📝 SETUP INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Install Required Libraries
────────────────────────────────────────────────────────────────────────────────
1. Open Arduino IDE
2. Sketch → Include Library → Manage Libraries
3. Install these:
   
   a) PubSubClient
      Search: "PubSubClient"
      Author: Nick O'Leary
      Click Install
   
   b) ArduinoJson
      Search: "ArduinoJson"
      Author: Benoit Blanchon
      Click Install
   
   c) DHT sensor library
      Search: "DHT sensor library"
      Author: Adafruit
      Click Install


STEP 2: Verify Configuration
────────────────────────────────────────────────────────────────────────────────
Check these settings (already correct):

WiFi:
  SSID: kamesh
  Password: 6205648562

MQTT:
  Server: broker.hivemq.com
  Port: 1883
  Client ID: bsf-phase1-esp32

Device:
  Device ID: BSF_001
  Location: Lab_Rack_1


STEP 3: Verify Hardware Connections
────────────────────────────────────────────────────────────────────────────────
Before uploading, check:

DHT22:
  ├─ VCC (red) → 3.3V
  ├─ GND (black) → GND
  └─ DATA (yellow) → GPIO 4 ✓

MQ135:
  ├─ VCC (red) → 3.3V
  ├─ GND (black) → GND
  └─ A0 (yellow) → GPIO 34 ✓

Relay:
  ├─ IN (signal) → GPIO 17 ✓
  ├─ VCC → 5V
  └─ GND → GND


STEP 4: Upload Code
────────────────────────────────────────────────────────────────────────────────
1. Tools → Board: Select "ESP32 Wrover Module"
2. Tools → Port: Select your COM port (COM3, COM4, etc.)
3. Tools → Upload Speed: 921600 or 115200
4. Sketch → Upload (or press Ctrl+U)
5. Wait for "Upload complete!"


STEP 5: Monitor Serial Output
────────────────────────────────────────────────────────────────────────────────
1. Tools → Serial Monitor
2. Set Baud Rate: 115200
3. Reset ESP32 (press EN button)
4. Watch for messages:

Expected output:
   ╔═══════════════════════════════════════════════════════════════╗
   ║  BSF LARVAE MONITORING SYSTEM (MQTT - PHASE 2)              ║
   ║  - Temperature & Humidity Monitoring                          ║
   ║  - Air Quality Control                                        ║
   ║  - Automatic Fan Management                                   ║
   ║  - MQTT Integration                                           ║
   ╚═══════════════════════════════════════════════════════════════╝
   
   [DHT22] ✅ Initialized on GPIO 4
   [RELAY] ✅ Initialized on GPIO 17
   
   ═══════════════════════════════════════════════════════════════
   🌐 WIFI Connection
   ═══════════════════════════════════════════════════════════════
   [WiFi] Connecting to: kamesh
   [WiFi] ✅ Connected!
   [WiFi] IP Address: 192.168.x.x
   [WiFi] Signal Strength: -xx dBm
   
   ═══════════════════════════════════════════════════════════════
   🔌 MQTT Setup
   ═══════════════════════════════════════════════════════════════
   [MQTT] Broker: broker.hivemq.com
   
   [MQTT] 🔄 Connecting... ✅ Connected!
   [MQTT] ✅ Subscribed to:
   [MQTT]   - biopod/bsf/control/fan
   [MQTT]   - biopod/bsf/settings/thresholds
   [MQTT] 📤 Online status published
   
   [SYSTEM] 🚀 Initialization complete
   
   [SENSOR] 🌡️ Temp: 28.50°C | 💧 Humidity: 65.30% | 💨 MQ135: 1750
   [RELAY] ✅ Fan OFF
   [CSV] 💾 Data logged to SPIFFS
   [MQTT] 📤 All sensor data published


═══════════════════════════════════════════════════════════════════════════════
✅ SUCCESS INDICATORS
═══════════════════════════════════════════════════════════════════════════════

When everything is working, you should see:

1. WiFi Connection ✅
   [WiFi] ✅ Connected!

2. MQTT Connection ✅
   [MQTT] 🔄 Connecting... ✅ Connected!

3. Sensor Readings ✅
   [SENSOR] 🌡️ Temp: 28.50°C | 💧 Humidity: 65.30%

4. Fan Control ✅
   [RELAY] ✅ Fan OFF/ON

5. Data Publishing ✅
   [MQTT] 📤 All sensor data published

6. CSV Logging ✅
   [CSV] 💾 Data logged to SPIFFS


═══════════════════════════════════════════════════════════════════════════════
⚠️ TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

WiFi not connecting?
→ Check SSID: "kamesh"
→ Check password: "6205648562"
→ Check WiFi is visible and on

MQTT not connecting?
→ Check internet connection
→ Verify broker: broker.hivemq.com is online
→ Check serial monitor for error codes

Sensors not reading?
→ Check GPIO connections
→ Verify 3.3V power
→ Check sensor type

Data not publishing?
→ Verify WiFi & MQTT connected
→ Check MQTT topics spelling
→ Monitor serial for errors

═══════════════════════════════════════════════════════════════════════════════
✅ ARDUINO CODE COMPLETE!
═══════════════════════════════════════════════════════════════════════════════