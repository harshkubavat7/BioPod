/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📨 MQTT MESSAGE HANDLER MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * File: backend/src/handlers/mqtt.handler.js
 * Purpose: Handle incoming MQTT messages from Arduino sensors
 * Features:
 *   - Temperature message handler
 *   - Humidity message handler
 *   - Light level message handler
 *   - Soil moisture message handler
 *   - CO2 message handler
 *   - Status message handler
 *   - Message routing
 *   - Error handling
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { getMQTTClient, MQTT_TOPICS } = require('../config/mqtt');
const { processSensorReading } = require('../services/mqtt.service');

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle Temperature Message
 * Topic: biopod/sensors/temperature
 * Expected format: { value: 28.5, box_id: "BOX_001" }
 * 
 * @param {Buffer} message - Raw MQTT message
 */
async function handleTemperature(message) {
  try {
    const data = JSON.parse(message.toString());
    
    console.log('[MQTT] Temperature received:', data);

    // Process and save to database
    await processSensorReading({
      box_id: data.box_id || 'BOX_001',
      sensor_type: 'temperature',
      value: data.value,
      unit: '°C',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[MQTT] ❌ Temperature handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle Humidity Message
 * Topic: biopod/sensors/humidity
 * Expected format: { value: 65.2, box_id: "BOX_001" }
 * 
 * @param {Buffer} message - Raw MQTT message
 */
async function handleHumidity(message) {
  try {
    const data = JSON.parse(message.toString());
    
    console.log('[MQTT] Humidity received:', data);

    // Process and save to database
    await processSensorReading({
      box_id: data.box_id || 'BOX_001',
      sensor_type: 'humidity',
      value: data.value,
      unit: '%',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[MQTT] ❌ Humidity handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle Light Level Message
 * Topic: biopod/sensors/light
 * Expected format: { value: 75.0, box_id: "BOX_001" }
 * 
 * @param {Buffer} message - Raw MQTT message
 */
async function handleLight(message) {
  try {
    const data = JSON.parse(message.toString());
    
    console.log('[MQTT] Light level received:', data);

    // Process and save to database
    await processSensorReading({
      box_id: data.box_id || 'BOX_001',
      sensor_type: 'light',
      value: data.value,
      unit: 'lux',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[MQTT] ❌ Light handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle Soil Moisture Message
 * Topic: biopod/sensors/soil_moisture
 * Expected format: { value: 45.5, box_id: "BOX_001" }
 * 
 * @param {Buffer} message - Raw MQTT message
 */
async function handleSoilMoisture(message) {
  try {
    const data = JSON.parse(message.toString());
    
    console.log('[MQTT] Soil moisture received:', data);

    // Process and save to database
    await processSensorReading({
      box_id: data.box_id || 'BOX_001',
      sensor_type: 'soil_moisture',
      value: data.value,
      unit: '%',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[MQTT] ❌ Soil moisture handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle CO2 Message
 * Topic: biopod/sensors/co2
 * Expected format: { value: 400.0, box_id: "BOX_001" }
 * 
 * @param {Buffer} message - Raw MQTT message
 */
async function handleCO2(message) {
  try {
    const data = JSON.parse(message.toString());
    
    console.log('[MQTT] CO2 received:', data);

    // Process and save to database
    await processSensorReading({
      box_id: data.box_id || 'BOX_001',
      sensor_type: 'co2',
      value: data.value,
      unit: 'ppm',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[MQTT] ❌ CO2 handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle Status Message
 * Topic: biopod/status
 * Expected format: { status: "online", box_id: "BOX_001" }
 * 
 * @param {Buffer} message - Raw MQTT message
 */
async function handleStatus(message) {
  try {
    const data = JSON.parse(message.toString());
    
    console.log('[MQTT] Status update:', data);
    // Status tracking can be extended as needed

  } catch (error) {
    console.error('[MQTT] ❌ Status handler error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZE MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize all MQTT message handlers
 * Attaches handlers to their respective topics
 */
function initMQTTHandlers() {
  const client = getMQTTClient();

  if (!client) {
    console.error('[MQTT] ❌ MQTT client not initialized');
    return;
  }

  console.log('[MQTT] Initializing message handlers...');

  // ═════════════════════════════════════════════════════════════════
  // Temperature Handler
  // ═════════════════════════════════════════════════════════════════
  client.on('message', (topic, message) => {
    if (topic === MQTT_TOPICS.TEMPERATURE) {
      handleTemperature(message);
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // Humidity Handler
  // ═════════════════════════════════════════════════════════════════
  client.on('message', (topic, message) => {
    if (topic === MQTT_TOPICS.HUMIDITY) {
      handleHumidity(message);
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // Light Handler
  // ═════════════════════════════════════════════════════════════════
  client.on('message', (topic, message) => {
    if (topic === MQTT_TOPICS.LIGHT) {
      handleLight(message);
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // Soil Moisture Handler
  // ═════════════════════════════════════════════════════════════════
  client.on('message', (topic, message) => {
    if (topic === MQTT_TOPICS.SOIL_MOISTURE) {
      handleSoilMoisture(message);
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // CO2 Handler
  // ═════════════════════════════════════════════════════════════════
  client.on('message', (topic, message) => {
    if (topic === MQTT_TOPICS.CO2) {
      handleCO2(message);
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // Status Handler
  // ═════════════════════════════════════════════════════════════════
  client.on('message', (topic, message) => {
    if (topic === MQTT_TOPICS.STATUS) {
      handleStatus(message);
    }
  });

  console.log('[MQTT] ✅ All message handlers initialized');
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  handleTemperature,
  handleHumidity,
  handleLight,
  handleSoilMoisture,
  handleCO2,
  handleStatus,
  initMQTTHandlers
};

/**
 * USAGE EXAMPLE:
 * 
 * const { initMQTTHandlers } = require('./handlers/mqtt.handler');
 * 
 * // After MQTT is connected:
 * initMQTTHandlers();
 * 
 * // Now messages on biopod/sensors/temperature, 
 * // biopod/sensors/humidity, etc. will be automatically handled
 */
