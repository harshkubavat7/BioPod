const mqtt = require('mqtt');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// MQTT Topics for BioPod sensors
const MQTT_TOPICS = {
  TEMPERATURE: 'biopod/sensors/temperature',
  HUMIDITY: 'biopod/sensors/humidity',
  LIGHT: 'biopod/sensors/light',
  SOIL_MOISTURE: 'biopod/sensors/soil_moisture',
  CO2: 'biopod/sensors/co2',
  STATUS: 'biopod/status'
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let mqttClient = null;
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CONNECTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Connect to MQTT Broker
 * Establishes connection and sets up event handlers
 * 
 * @returns {Promise<Object>} Connected MQTT client
 * @throws {Error} If connection fails after max attempts
 */
async function connectMQTT() {
  return new Promise((resolve, reject) => {
    try {
      console.log('[MQTT] Connecting to broker...');
      console.log(`[MQTT] Broker: ${MQTT_BROKER}`);

      // Create MQTT client options
      const clientOptions = {
        clientId: `biopod-${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        username: MQTT_USERNAME || undefined,
        password: MQTT_PASSWORD || undefined,
        will: {
          topic: MQTT_TOPICS.STATUS,
          payload: JSON.stringify({
            status: 'offline',
            timestamp: new Date().toISOString()
          }),
          qos: 1,
          retain: false
        }
      };

      // Remove undefined fields
      if (!clientOptions.username) delete clientOptions.username;
      if (!clientOptions.password) delete clientOptions.password;

      // Create MQTT client
      mqttClient = mqtt.connect(MQTT_BROKER, clientOptions);

      // ═════════════════════════════════════════════════════════════════
      // EVENT: Connected
      // ═════════════════════════════════════════════════════════════════
      mqttClient.on('connect', () => {
        isConnected = true;
        connectionAttempts = 0;

        console.log('[MQTT] ✅ Connected to broker');
        console.log('[MQTT] Client ID: ' + clientOptions.clientId);

        // Subscribe to all sensor topics
        const topicsArray = Object.values(MQTT_TOPICS);
        
        mqttClient.subscribe(topicsArray, (err) => {
          if (err) {
            console.error('[MQTT] ❌ Subscribe error:', err.message);
          } else {
            console.log('[MQTT] ✅ Subscribed to topics:');
            topicsArray.forEach(topic => {
              console.log(`     - ${topic}`);
            });
          }
        });

        // Publish online status
        mqttClient.publish(MQTT_TOPICS.STATUS, JSON.stringify({
          status: 'online',
          timestamp: new Date().toISOString()
        }), { qos: 1 });

        resolve(mqttClient);
      });

      // ═════════════════════════════════════════════════════════════════
      // EVENT: Error
      // ═════════════════════════════════════════════════════════════════
      mqttClient.on('error', (error) => {
        console.error('[MQTT] ❌ Connection error:', error.message);
        isConnected = false;
      });

      // ═════════════════════════════════════════════════════════════════
      // EVENT: Offline
      // ═════════════════════════════════════════════════════════════════
      mqttClient.on('offline', () => {
        isConnected = false;
        console.warn('[MQTT] ⚠️  Connection offline - attempting reconnect...');
      });

      // ═════════════════════════════════════════════════════════════════
      // EVENT: Reconnect
      // ═════════════════════════════════════════════════════════════════
      mqttClient.on('reconnect', () => {
        connectionAttempts++;
        console.log(`[MQTT] 🔄 Reconnection attempt ${connectionAttempts}...`);

        if (connectionAttempts > MAX_RECONNECT_ATTEMPTS) {
          mqttClient.end();
          console.error('[MQTT] ❌ Max reconnection attempts reached');
        }
      });

      // ═════════════════════════════════════════════════════════════════
      // EVENT: Message Received
      // ═════════════════════════════════════════════════════════════════
      mqttClient.on('message', (topic, message) => {
        console.log(`[MQTT] Message on topic: ${topic}`);
        console.log(`[MQTT] Payload: ${message.toString()}`);
        // Message handling will be done in mqtt.handler.js
      });

      // ═════════════════════════════════════════════════════════════════
      // EVENT: Close
      // ═════════════════════════════════════════════════════════════════
      mqttClient.on('close', () => {
        isConnected = false;
        console.log('[MQTT] Connection closed');
      });

      // Timeout for connection
      setTimeout(() => {
        if (!isConnected) {
          reject(new Error('[MQTT] Connection timeout - broker unreachable'));
        }
      }, 5000);

    } catch (error) {
      console.error('[MQTT] ❌ Connection setup error:', error.message);
      reject(error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GET CLIENT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the MQTT client instance
 * Returns existing client or null if not connected
 * 
 * @returns {Object|null} MQTT client or null
 */
function getMQTTClient() {
  return mqttClient;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTION STATUS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if connected to MQTT broker
 * 
 * @returns {boolean} True if connected
 */
function isConnectedToMQTT() {
  return isConnected && mqttClient !== null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLISH MESSAGE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Publish message to MQTT topic
 * 
 * @param {string} topic - Topic name
 * @param {Object} message - Message object (will be JSON stringified)
 * @param {number} qos - Quality of Service (0, 1, or 2)
 * @returns {Promise<void>}
 */
function publishMessage(topic, message, qos = 1) {
  return new Promise((resolve, reject) => {
    if (!isConnectedToMQTT()) {
      reject(new Error('[MQTT] Not connected to broker'));
      return;
    }

    const payload = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);

    mqttClient.publish(topic, payload, { qos }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// CLOSE CONNECTION FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Close MQTT connection gracefully
 * 
 * @returns {Promise<void>}
 */
async function closeMQTT() {
  return new Promise((resolve) => {
    if (mqttClient) {
      console.log('[MQTT] Closing connection...');
      
      // Unsubscribe from all topics
      mqttClient.unsubscribe(Object.values(MQTT_TOPICS), (err) => {
        if (err) {
          console.warn('[MQTT] Unsubscribe warning:', err.message);
        }
      });

      // End connection
      mqttClient.end(false, () => {
        isConnected = false;
        mqttClient = null;
        console.log('[MQTT] ✅ Connection closed');
        resolve();
      });

      // Force close after 3 seconds
      setTimeout(() => {
        if (mqttClient) {
          mqttClient.end(true);
          mqttClient = null;
          isConnected = false;
        }
        resolve();
      }, 3000);
    } else {
      resolve();
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  connectMQTT,
  getMQTTClient,
  isConnectedToMQTT,
  publishMessage,
  closeMQTT,
  MQTT_TOPICS,
  MQTT_BROKER
};