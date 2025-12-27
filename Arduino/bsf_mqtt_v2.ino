╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   🔄 MIGRATION GUIDE: BLYNK → MQTT (COMPLETE ANALYSIS & CONVERSION)          ║
║                                                                               ║
║              Convert your BSF Phase 1 code to MQTT Integration                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Date: December 27, 2025
Current Status: Blynk-based system with offline capability
Target Status: MQTT-based system with persistent storage
Effort: 3-4 hours for complete conversion

═══════════════════════════════════════════════════════════════════════════════

📊 CURRENT SYSTEM ANALYSIS

═══════════════════════════════════════════════════════════════════════════════

YOUR EXISTING CODE (bsf_phase_1):
────────────────────────────────────────────────────────────────────────────────

Hardware:
  ✅ ESP32 Dev Board
  ✅ DHT22 (Temperature & Humidity)
  ✅ MQ135 (Air Quality/CO2)
  ✅ 1 Relay (Fan control)

Connectivity:
  ✅ WiFi: Blynk connection
  ✅ Offline Mode: Local operation works
  ✅ Data: CSV logging on SPIFFS

Control Logic:
  ✅ Auto mode: MQ135 > 1800 → Fan ON
  ✅ Manual mode: Override via Blynk V4
  ✅ Manual timeout: 5 minutes (300s)
  ✅ Hysteresis: MQ135 between 1600-1800

Current Flow:
  Sensors → Read (1s) → Log CSV (5s) → Send Blynk (60s) → Manual Control

═══════════════════════════════════════════════════════════════════════════════

🎯 WHY MIGRATE TO MQTT?

═══════════════════════════════════════════════════════════════════════════════

Current Limitations (Blynk):
  ❌ Blynk dependency (cloud service)
  ❌ No persistent database
  ❌ Limited historical data
  ❌ CSV only on local device
  ❌ No real-time analytics
  ❌ Limited automation triggers

New Benefits (MQTT):
  ✅ Your own backend (no cloud dependency)
  ✅ MongoDB persistent storage
  ✅ Complete historical data
  ✅ Real-time analytics & queries
  ✅ Custom automation rules
  ✅ Web dashboard possibility
  ✅ Multiple sensor integration
  ✅ Better scalability

═══════════════════════════════════════════════════════════════════════════════

🔄 CONVERSION STRATEGY

═══════════════════════════════════════════════════════════════════════════════

PHASE 1: Create New Arduino Sketch (MQTT Version)
────────────────────────────────────────────────────────────────────────────────

What to do:
  1. Keep all hardware logic (DHT22, MQ135, Relay)
  2. Replace Blynk with MQTT
  3. Keep CSV logging (optional, for offline backup)
  4. Keep manual control logic
  5. Replace Blynk virtual pins with MQTT topics

Topics to use:
  Publish (Sensors → Backend):
    - biopod/bsf/sensors/temperature
    - biopod/bsf/sensors/humidity
    - biopod/bsf/sensors/air_quality
    - biopod/bsf/status/fan

  Subscribe (Control → Arduino):
    - biopod/bsf/control/fan (manual on/off)
    - biopod/bsf/settings/thresholds


PHASE 2: Backend Processing
────────────────────────────────────────────────────────────────────────────────

Already created (Files you have):
  ✅ mqtt.js - MQTT broker connection
  ✅ mqtt.handler.js - Message routing
  ✅ mqtt.service.js - Data processing
  ✅ server.js - Updated with MQTT

Just need:
  Create: routes/bsf.js (BSF-specific API endpoints)
  Create: services/bsf.service.js (BSF business logic)


PHASE 3: Database Collections
────────────────────────────────────────────────────────────────────────────────

Create MongoDB collections:
  - bsf_logs (sensor readings)
  - bsf_config (settings & thresholds)
  - bsf_events (manual overrides, mode changes)


PHASE 4: Testing & Verification
────────────────────────────────────────────────────────────────────────────────

Test:
  1. Arduino connects to MQTT
  2. Sensors data published
  3. Backend receives & stores
  4. Manual control works
  5. CSV logging still works (optional)

═══════════════════════════════════════════════════════════════════════════════

⚡ STEP-BY-STEP CONVERSION

═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
STEP 1: CREATE NEW ARDUINO SKETCH (bsf_mqtt_v2.ino)
═══════════════════════════════════════════════════════════════════════════════

This is your existing code converted to MQTT.

Key changes:
  1. Remove Blynk includes & config
  2. Add PubSubClient & ArduinoJson
  3. Replace Blynk functions with MQTT pub/sub
  4. Keep all sensor reading logic
  5. Keep all relay control logic
  6. Keep CSV logging (optional)

Copy this code:

---

/************************************************************
      BSF LARVAE MONITORING SYSTEM (MQTT VERSION - V2)
      - MQTT instead of Blynk
      - MQ135 auto ventilation
      - DHT22 temperature/humidity
      - Fan control (1 relay)
      - Manual override + auto recovery
      - CSV logging (optional offline backup)
      
      Created: December 27, 2025
      Hardware: ESP32 + DHT22 + MQ135 + 1 Relay
*************************************************************/

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <SPIFFS.h>

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "kamesh";
const char* WIFI_PASSWORD = "6205648562";

// MQTT Configuration
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "bsf-phase1-esp32";

// Device Identification
const char* DEVICE_ID = "BSF_001";
const char* LOCATION = "Lab_Rack_1";

// ═══════════════════════════════════════════════════════════════════════════
// 🔌 PIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define RELAY_FAN 17

// ═══════════════════════════════════════════════════════════════════════════
// 🔌 OBJECT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// ═══════════════════════════════════════════════════════════════════════════
// 📊 VARIABLES & STATE
// ═══════════════════════════════════════════════════════════════════════════

// Sensor readings
float temperature = 0;
float humidity = 0;
int airQuality = 0;

// Relay states
bool fanState = false;
bool ACTIVE_LOW = true;

// Control states
int manualFan = 0;
bool fanManualMode = false;
unsigned long manualModeStart = 0;

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastMQTTPublish = 0;
unsigned long lastLogTime = 0;
unsigned long lastWiFiCheck = 0;

// Thresholds
int MQ_THRESHOLD_HIGH = 1800;  // Fan ON
int MQ_THRESHOLD_LOW = 1600;   // Fan OFF
int MANUAL_MODE_TIMEOUT = 300000; // 5 minutes

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 MQTT TOPICS
// ═══════════════════════════════════════════════════════════════════════════

const char* TOPIC_TEMP = "biopod/bsf/sensors/temperature";
const char* TOPIC_HUMIDITY = "biopod/bsf/sensors/humidity";
const char* TOPIC_AIR_QUALITY = "biopod/bsf/sensors/air_quality";
const char* TOPIC_FAN_STATUS = "biopod/bsf/status/fan";
const char* TOPIC_FAN_CONTROL = "biopod/bsf/control/fan";
const char* TOPIC_SETTINGS = "biopod/bsf/settings/thresholds";
const char* TOPIC_STATUS = "biopod/bsf/status/online";

// ═══════════════════════════════════════════════════════════════════════════
// ⚙️ RELAY HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void relayOn(int pin) {
  digitalWrite(pin, ACTIVE_LOW ? LOW : HIGH);
  fanState = true;
  Serial.println("[RELAY] Fan ON");
}

void relayOff(int pin) {
  digitalWrite(pin, ACTIVE_LOW ? HIGH : LOW);
  fanState = false;
  Serial.println("[RELAY] Fan OFF");
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 WIFI SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi() {
  Serial.println("");
  Serial.println("═══════════════════════════════════════════");
  Serial.println("🌐 WiFi Connection");
  Serial.println("═══════════════════════════════════════════");

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
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("[WiFi] ❌ Connection failed - continuing offline");
  }

  Serial.println("═══════════════════════════════════════════");
  Serial.println("");
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔌 MQTT CALLBACK (Receive messages)
// ═══════════════════════════════════════════════════════════════════════════

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Message on topic: ");
  Serial.println(topic);

  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("[MQTT] Payload: ");
  Serial.println(message);

  // ─────────────────────────────────────────────────────────────────────
  // Handle Fan Control (biopod/bsf/control/fan)
  // ─────────────────────────────────────────────────────────────────────
  if (strcmp(topic, TOPIC_FAN_CONTROL) == 0) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
      Serial.println("[MQTT] JSON parse failed!");
      return;
    }

    // Get control command
    const char* command = doc["command"];
    
    if (strcmp(command, "ON") == 0) {
      manualFan = 1;
      fanManualMode = true;
      manualModeStart = millis();
      Serial.println("[CONTROL] Manual FAN ON (5-min timeout)");
    } 
    else if (strcmp(command, "OFF") == 0) {
      manualFan = 0;
      fanManualMode = true;
      manualModeStart = millis();
      Serial.println("[CONTROL] Manual FAN OFF (5-min timeout)");
    }
    else if (strcmp(command, "AUTO") == 0) {
      fanManualMode = false;
      Serial.println("[CONTROL] Returned to AUTO mode");
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Handle Settings Update (biopod/bsf/settings/thresholds)
  // ─────────────────────────────────────────────────────────────────────
  if (strcmp(topic, TOPIC_SETTINGS) == 0) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
      Serial.println("[MQTT] JSON parse failed!");
      return;
    }

    if (doc.containsKey("mq_high")) {
      MQ_THRESHOLD_HIGH = doc["mq_high"];
      Serial.print("[SETTINGS] MQ High threshold: ");
      Serial.println(MQ_THRESHOLD_HIGH);
    }

    if (doc.containsKey("mq_low")) {
      MQ_THRESHOLD_LOW = doc["mq_low"];
      Serial.print("[SETTINGS] MQ Low threshold: ");
      Serial.println(MQ_THRESHOLD_LOW);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔌 MQTT SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setupMQTT() {
  Serial.println("");
  Serial.println("═══════════════════════════════════════════");
  Serial.println("🔌 MQTT Setup");
  Serial.println("═══════════════════════════════════════════");

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);

  Serial.print("[MQTT] Broker: ");
  Serial.println(MQTT_SERVER);

  Serial.println("═══════════════════════════════════════════");
  Serial.println("");
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔌 MQTT CONNECT
// ═══════════════════════════════════════════════════════════════════════════

void connectMQTT() {
  if (client.connected()) {
    return;
  }

  Serial.print("[MQTT] Connecting...");

  if (client.connect(MQTT_CLIENT_ID)) {
    Serial.println(" ✅ Connected!");

    // Subscribe to control topics
    client.subscribe(TOPIC_FAN_CONTROL);
    client.subscribe(TOPIC_SETTINGS);

    Serial.println("[MQTT] ✅ Subscribed to control topics");

    // Publish online status
    DynamicJsonDocument statusDoc(256);
    statusDoc["device"] = DEVICE_ID;
    statusDoc["location"] = LOCATION;
    statusDoc["status"] = "online";
    statusDoc["timestamp"] = millis();

    char statusBuffer[256];
    serializeJson(statusDoc, statusBuffer);
    client.publish(TOPIC_STATUS, statusBuffer);

  } else {
    Serial.print(" ❌ Failed, rc=");
    Serial.print(client.state());
    Serial.println(" retrying in 5 sec");
    delay(5000);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 READ SENSORS
// ═══════════════════════════════════════════════════════════════════════════

void readSensors() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  airQuality = analogRead(MQ135_PIN);

  // Check for valid readings
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[SENSOR] ❌ DHT22 read failed!");
    return;
  }

  Serial.printf("[SENSOR] Temp: %.2f°C | Humidity: %.2f%% | MQ135: %d\n",
                temperature, humidity, airQuality);
}

// ═══════════════════════════════════════════════════════════════════════════
// 📤 PUBLISH TO MQTT
// ═══════════════════════════════════════════════════════════════════════════

void publishSensorData() {
  if (!client.connected()) {
    return;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Publish Temperature
  // ─────────────────────────────────────────────────────────────────────
  DynamicJsonDocument tempDoc(256);
  tempDoc["device"] = DEVICE_ID;
  tempDoc["value"] = temperature;
  tempDoc["unit"] = "°C";
  tempDoc["timestamp"] = millis();

  char tempBuffer[256];
  serializeJson(tempDoc, tempBuffer);
  client.publish(TOPIC_TEMP, tempBuffer);

  delay(100);

  // ─────────────────────────────────────────────────────────────────────
  // Publish Humidity
  // ─────────────────────────────────────────────────────────────────────
  DynamicJsonDocument humidityDoc(256);
  humidityDoc["device"] = DEVICE_ID;
  humidityDoc["value"] = humidity;
  humidityDoc["unit"] = "%";
  humidityDoc["timestamp"] = millis();

  char humidityBuffer[256];
  serializeJson(humidityDoc, humidityBuffer);
  client.publish(TOPIC_HUMIDITY, humidityBuffer);

  delay(100);

  // ─────────────────────────────────────────────────────────────────────
  // Publish Air Quality (MQ135)
  // ─────────────────────────────────────────────────────────────────────
  DynamicJsonDocument aqDoc(256);
  aqDoc["device"] = DEVICE_ID;
  aqDoc["value"] = airQuality;
  aqDoc["unit"] = "ppm";
  aqDoc["timestamp"] = millis();

  char aqBuffer[256];
  serializeJson(aqDoc, aqBuffer);
  client.publish(TOPIC_AIR_QUALITY, aqBuffer);

  delay(100);

  // ─────────────────────────────────────────────────────────────────────
  // Publish Fan Status
  // ─────────────────────────────────────────────────────────────────────
  DynamicJsonDocument fanDoc(256);
  fanDoc["device"] = DEVICE_ID;
  fanDoc["state"] = fanState ? "ON" : "OFF";
  fanDoc["mode"] = fanManualMode ? "MANUAL" : "AUTO";
  fanDoc["timestamp"] = millis();

  char fanBuffer[256];
  serializeJson(fanDoc, fanBuffer);
  client.publish(TOPIC_FAN_STATUS, fanBuffer);

  Serial.println("[MQTT] ✅ Data published");
}

// ═══════════════════════════════════════════════════════════════════════════
// 💾 LOG TO CSV (OPTIONAL - OFFLINE BACKUP)
// ═══════════════════════════════════════════════════════════════════════════

void logToCSV() {
  if (!SPIFFS.begin(true)) {
    Serial.println("[CSV] SPIFFS failed!");
    return;
  }

  File file = SPIFFS.open("/bsf_datalog.csv", FILE_APPEND);
  if (!file) {
    Serial.println("[CSV] Error opening file!");
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
  Serial.println("[CSV] ✅ Data logged");
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎛️ FAN CONTROL LOGIC
// ═══════════════════════════════════════════════════════════════════════════

void updateFanControl() {
  // ─────────────────────────────────────────────────────────────────────
  // Auto-reset manual mode after 5 minutes
  // ─────────────────────────────────────────────────────────────────────
  if (fanManualMode && (millis() - manualModeStart > MANUAL_MODE_TIMEOUT)) {
    fanManualMode = false;
    Serial.println("[CONTROL] ⏱️ Manual mode timeout → AUTO mode");
  }

  // ─────────────────────────────────────────────────────────────────────
  // Manual Mode Control
  // ─────────────────────────────────────────────────────────────────────
  if (fanManualMode) {
    if (manualFan == 1) {
      relayOn(RELAY_FAN);
    } else {
      relayOff(RELAY_FAN);
    }
  }
  // ─────────────────────────────────────────────────────────────────────
  // Auto Mode Control (Hysteresis)
  // ─────────────────────────────────────────────────────────────────────
  else {
    if (airQuality > MQ_THRESHOLD_HIGH) {
      relayOn(RELAY_FAN);
    }
    else if (airQuality < MQ_THRESHOLD_LOW) {
      relayOff(RELAY_FAN);
    }
    // Between thresholds: no change (hysteresis)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("");
  Serial.println("╔═══════════════════════════════════════════╗");
  Serial.println("║   BSF Larvae Monitoring System (MQTT)    ║");
  Serial.println("║   Version 2.0                             ║");
  Serial.println("╚═══════════════════════════════════════════╝");

  // Initialize DHT22
  dht.begin();
  Serial.println("[DHT22] ✅ Initialized");

  // Initialize Relay
  pinMode(RELAY_FAN, OUTPUT);
  relayOff(RELAY_FAN);
  Serial.println("[RELAY] ✅ Initialized");

  // Initialize WiFi
  setupWiFi();

  // Initialize MQTT
  setupMQTT();

  Serial.println("[SYSTEM] 🚀 Ready to start");
  Serial.println("");
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 LOOP
// ═══════════════════════════════════════════════════════════════════════════

void loop() {
  unsigned long now = millis();

  // ═════════════════════════════════════════════════════════════════════
  // WiFi Connection Check (every 10 seconds)
  // ═════════════════════════════════════════════════════════════════════
  if (now - lastWiFiCheck >= 10000) {
    lastWiFiCheck = now;

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] ⚠️ Reconnecting...");
      WiFi.reconnect();
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // MQTT Connection Maintain
  // ═════════════════════════════════════════════════════════════════════
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  // ═════════════════════════════════════════════════════════════════════
  // Read Sensors (every 1 second)
  // ═════════════════════════════════════════════════════════════════════
  if (now - lastSensorRead >= 1000) {
    lastSensorRead = now;

    readSensors();
    updateFanControl();

    // Log to CSV (every 5 seconds)
    if (now - lastLogTime >= 5000) {
      lastLogTime = now;
      logToCSV();
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // Publish to MQTT (every 30 seconds)
  // ═════════════════════════════════════════════════════════════════════
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

1. Install Libraries:
   - Open Arduino IDE
   - Sketch → Include Library → Manage Libraries
   - Search "PubSubClient" → Install by Nick O'Leary
   - Search "ArduinoJson" → Install by Benoit Blanchon
   - Search "DHT sensor" → Install by Adafruit

2. Update Configuration:
   - WIFI_SSID = "kamesh" (already set)
   - WIFI_PASSWORD = "6205648562" (already set)
   - MQTT_SERVER = "broker.hivemq.com" (public broker)
   - DEVICE_ID = "BSF_001" (change if multiple devices)

3. Wire Hardware:
   - DHT22 DATA → GPIO 4, VCC → 3.3V, GND → GND
   - MQ135 AO → GPIO 34, VCC → 3.3V, GND → GND
   - Relay IN → GPIO 17, VCC → 5V, GND → GND

4. Upload:
   - Select Board: ESP32 Dev Module
   - Select Port: Your COM port
   - Click Upload

5. Monitor:
   - Tools → Serial Monitor
   - Set Baud: 115200
   - Watch output

═══════════════════════════════════════════════════════════════════════════════
🎯 EXPECTED OUTPUT
═══════════════════════════════════════════════════════════════════════════════

After upload, Serial Monitor should show:

╔═══════════════════════════════════════════╗
║   BSF Larvae Monitoring System (MQTT)    ║
║   Version 2.0                             ║
╚═══════════════════════════════════════════╝

[DHT22] ✅ Initialized
[RELAY] ✅ Initialized

═══════════════════════════════════════════
🌐 WiFi Connection
═══════════════════════════════════════════
[WiFi] Connecting to: kamesh
...........
[WiFi] ✅ Connected!
[WiFi] IP: 192.168.x.x
[WiFi] Signal: -45 dBm

═══════════════════════════════════════════
🔌 MQTT Setup
═══════════════════════════════════════════
[MQTT] Broker: broker.hivemq.com

═══════════════════════════════════════════

[SYSTEM] 🚀 Ready to start

[SENSOR] Temp: 28.50°C | Humidity: 65.30% | MQ135: 1750
[RELAY] Fan OFF
[CSV] ✅ Data logged
[MQTT] ✅ Data published

═══════════════════════════════════════════════════════════════════════════════
✅ FEATURES INCLUDED
═══════════════════════════════════════════════════════════════════════════════

✅ MQTT Publish:
   - Temperature (every 30 sec)
   - Humidity (every 30 sec)
   - Air Quality (every 30 sec)
   - Fan Status (every 30 sec)

✅ MQTT Subscribe:
   - Manual fan control
   - Threshold settings update

✅ Local Features:
   - CSV logging (every 5 sec)
   - Works offline

✅ Fan Control:
   - Auto mode (MQ135 based)
   - Manual mode (5-min timeout)
   - Hysteresis (1600-1800)

✅ Sensor Reading:
   - 1-second interval
   - Error checking
   - Formatted output

═══════════════════════════════════════════════════════════════════════════════
*/
