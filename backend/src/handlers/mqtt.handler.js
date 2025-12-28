// /**
//  * ═══════════════════════════════════════════════════════════════════════════
//  * 📨 MQTT MESSAGE HANDLER MODULE
//  * ═══════════════════════════════════════════════════════════════════════════
//  * 
//  * File: backend/src/handlers/mqtt.handler.js
//  * Purpose: Handle incoming MQTT messages from Arduino sensors
//  * Features:
//  *   - Temperature message handler
//  *   - Humidity message handler
//  *   - Light level message handler
//  *   - Soil moisture message handler
//  *   - CO2 message handler
//  *   - Status message handler
//  *   - Message routing
//  *   - Error handling
//  * 
//  * ═══════════════════════════════════════════════════════════════════════════
//  */

// const { getMQTTClient, MQTT_TOPICS } = require('../config/mqtt');
// const { processSensorReading } = require('../services/mqtt.service');

// // ═══════════════════════════════════════════════════════════════════════════
// // MESSAGE HANDLERS
// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Handle Temperature Message
//  * Topic: biopod/sensors/temperature
//  * Expected format: { value: 28.5, box_id: "BOX_001" }
//  * 
//  * @param {Buffer} message - Raw MQTT message
//  */
// async function handleTemperature(message) {
//   try {
//     const data = JSON.parse(message.toString());
    
//     console.log('[MQTT] Temperature received:', data);

//     // Process and save to database
//     await processSensorReading({
//       box_id: data.box_id || 'BOX_001',
//       sensor_type: 'temperature',
//       value: data.value,
//       unit: '°C',
//       timestamp: new Date()
//     });

//   } catch (error) {
//     console.error('[MQTT] ❌ Temperature handler error:', error.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Handle Humidity Message
//  * Topic: biopod/sensors/humidity
//  * Expected format: { value: 65.2, box_id: "BOX_001" }
//  * 
//  * @param {Buffer} message - Raw MQTT message
//  */
// async function handleHumidity(message) {
//   try {
//     const data = JSON.parse(message.toString());
    
//     console.log('[MQTT] Humidity received:', data);

//     // Process and save to database
//     await processSensorReading({
//       box_id: data.box_id || 'BOX_001',
//       sensor_type: 'humidity',
//       value: data.value,
//       unit: '%',
//       timestamp: new Date()
//     });

//   } catch (error) {
//     console.error('[MQTT] ❌ Humidity handler error:', error.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Handle Light Level Message
//  * Topic: biopod/sensors/light
//  * Expected format: { value: 75.0, box_id: "BOX_001" }
//  * 
//  * @param {Buffer} message - Raw MQTT message
//  */
// async function handleLight(message) {
//   try {
//     const data = JSON.parse(message.toString());
    
//     console.log('[MQTT] Light level received:', data);

//     // Process and save to database
//     await processSensorReading({
//       box_id: data.box_id || 'BOX_001',
//       sensor_type: 'light',
//       value: data.value,
//       unit: 'lux',
//       timestamp: new Date()
//     });

//   } catch (error) {
//     console.error('[MQTT] ❌ Light handler error:', error.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Handle Soil Moisture Message
//  * Topic: biopod/sensors/soil_moisture
//  * Expected format: { value: 45.5, box_id: "BOX_001" }
//  * 
//  * @param {Buffer} message - Raw MQTT message
//  */
// async function handleSoilMoisture(message) {
//   try {
//     const data = JSON.parse(message.toString());
    
//     console.log('[MQTT] Soil moisture received:', data);

//     // Process and save to database
//     await processSensorReading({
//       box_id: data.box_id || 'BOX_001',
//       sensor_type: 'soil_moisture',
//       value: data.value,
//       unit: '%',
//       timestamp: new Date()
//     });

//   } catch (error) {
//     console.error('[MQTT] ❌ Soil moisture handler error:', error.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Handle CO2 Message
//  * Topic: biopod/sensors/co2
//  * Expected format: { value: 400.0, box_id: "BOX_001" }
//  * 
//  * @param {Buffer} message - Raw MQTT message
//  */
// async function handleCO2(message) {
//   try {
//     const data = JSON.parse(message.toString());
    
//     console.log('[MQTT] CO2 received:', data);

//     // Process and save to database
//     await processSensorReading({
//       box_id: data.box_id || 'BOX_001',
//       sensor_type: 'co2',
//       value: data.value,
//       unit: 'ppm',
//       timestamp: new Date()
//     });

//   } catch (error) {
//     console.error('[MQTT] ❌ CO2 handler error:', error.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Handle Status Message
//  * Topic: biopod/status
//  * Expected format: { status: "online", box_id: "BOX_001" }
//  * 
//  * @param {Buffer} message - Raw MQTT message
//  */
// async function handleStatus(message) {
//   try {
//     const data = JSON.parse(message.toString());
    
//     console.log('[MQTT] Status update:', data);
//     // Status tracking can be extended as needed

//   } catch (error) {
//     console.error('[MQTT] ❌ Status handler error:', error.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════
// // INITIALIZE MESSAGE HANDLERS
// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Initialize all MQTT message handlers
//  * Attaches handlers to their respective topics
//  */
// function initMQTTHandlers() {
//   const client = getMQTTClient();

//   if (!client) {
//     console.error('[MQTT] ❌ MQTT client not initialized');
//     return;
//   }

//   console.log('[MQTT] Initializing message handlers...');

//   // ═════════════════════════════════════════════════════════════════
//   // Temperature Handler
//   // ═════════════════════════════════════════════════════════════════
//   client.on('message', (topic, message) => {
//     if (topic === MQTT_TOPICS.TEMPERATURE) {
//       handleTemperature(message);
//     }
//   });

//   // ═════════════════════════════════════════════════════════════════
//   // Humidity Handler
//   // ═════════════════════════════════════════════════════════════════
//   client.on('message', (topic, message) => {
//     if (topic === MQTT_TOPICS.HUMIDITY) {
//       handleHumidity(message);
//     }
//   });

//   // ═════════════════════════════════════════════════════════════════
//   // Light Handler
//   // ═════════════════════════════════════════════════════════════════
//   client.on('message', (topic, message) => {
//     if (topic === MQTT_TOPICS.LIGHT) {
//       handleLight(message);
//     }
//   });

//   // ═════════════════════════════════════════════════════════════════
//   // Soil Moisture Handler
//   // ═════════════════════════════════════════════════════════════════
//   client.on('message', (topic, message) => {
//     if (topic === MQTT_TOPICS.SOIL_MOISTURE) {
//       handleSoilMoisture(message);
//     }
//   });

//   // ═════════════════════════════════════════════════════════════════
//   // CO2 Handler
//   // ═════════════════════════════════════════════════════════════════
//   client.on('message', (topic, message) => {
//     if (topic === MQTT_TOPICS.CO2) {
//       handleCO2(message);
//     }
//   });

//   // ═════════════════════════════════════════════════════════════════
//   // Status Handler
//   // ═════════════════════════════════════════════════════════════════
//   client.on('message', (topic, message) => {
//     if (topic === MQTT_TOPICS.STATUS) {
//       handleStatus(message);
//     }
//   });

//   console.log('[MQTT] ✅ All message handlers initialized');
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // EXPORTS
// // ═════════════════════════════════════════════════════════════════════════════

// module.exports = {
//   handleTemperature,
//   handleHumidity,
//   handleLight,
//   handleSoilMoisture,
//   handleCO2,
//   handleStatus,
//   initMQTTHandlers
// };

// /**
//  * USAGE EXAMPLE:
//  * 
//  * const { initMQTTHandlers } = require('./handlers/mqtt.handler');
//  * 
//  * // After MQTT is connected:
//  * initMQTTHandlers();
//  * 
//  * // Now messages on biopod/sensors/temperature, 
//  * // biopod/sensors/humidity, etc. will be automatically handled
//  */


const { getDB } = require('../config/db');

/**
 * Initialize Collections for MQTT
 */
async function initializeCollections() {
  try {
    const db = await getDB();
    
    console.log('[MQTT Handler] Creating collections and indexes...');
    
    // Create indexes for sensor_logs
    await db.collection('sensor_logs').createIndex({ timestamp: -1 });
    await db.collection('sensor_logs').createIndex({ sensor_type: 1, timestamp: -1 });
    await db.collection('sensor_logs').createIndex({ device: 1, timestamp: -1 });
    
    // Create indexes for control_logs
    await db.collection('control_logs').createIndex({ timestamp: -1 });
    await db.collection('control_logs').createIndex({ device: 1, timestamp: -1 });
    
    // Create indexes for bsf_current_data
    await db.collection('bsf_current_data').createIndex({ device: 1 });
    
    console.log('[MQTT Handler] ✅ Collections initialized');
    return true;
  } catch (error) {
    console.error('[MQTT Handler] ❌ Failed to initialize collections:', error);
    return false;
  }
}

/**
 * Initialize BSF-specific handlers
 */
function initializeBsfHandlers(mqttClient) {
  console.log('[MQTT BSF] 🎯 Initializing BSF-specific handlers...');
  
  if (!mqttClient) {
    console.error('[MQTT BSF] ❌ MQTT client not provided');
    return false;
  }

  mqttClient.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());

      if (topic === 'biopod/bsf/sensors/temperature') {
        console.log('[MQTT Handler] 🌡️  BSF Temperature:', payload);
        await logSensorReading('bsf_temperature', payload.value, payload.unit, {
          device: payload.device
        });
      }
      else if (topic === 'biopod/bsf/sensors/humidity') {
        console.log('[MQTT Handler] 💧 BSF Humidity:', payload);
        await logSensorReading('bsf_humidity', payload.value, payload.unit, {
          device: payload.device
        });
      }
      else if (topic === 'biopod/bsf/sensors/air_quality') {
        console.log('[MQTT Handler] 💨 BSF Air Quality:', payload);
        await logSensorReading('bsf_air_quality', payload.value, payload.unit, {
          device: payload.device
        });
      }
      else if (topic === 'biopod/bsf/status/fan') {
        console.log('[MQTT Handler] 🎛️  BSF Fan Status:', payload);
        await logControlAction('fan_status_update', {
          device: payload.device,
          state: payload.state,
          mode: payload.mode
        });
      }
      else if (topic === 'biopod/bsf/status/online') {
        console.log('[MQTT Handler] 🟢 BSF Online Status:', payload);
      }
    } catch (error) {
      console.error('[MQTT Handler] ❌ Error parsing message:', error.message);
    }
  });

  console.log('[MQTT BSF] ✅ BSF handlers attached to MQTT client');
  return true;
}

/**
 * Initialize generic MQTT handlers
 */
function initMQTTHandlers() {
  console.log('[MQTT Handler] 🎯 Generic MQTT handlers initialized');
}

/**
 * Log sensor reading to database
 */
async function logSensorReading(sensorType, value, unit, metadata = {}) {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');
    
    const document = {
      sensor_type: sensorType,
      value: value,
      unit: unit,
      device: metadata.device || 'BSF_001',
      timestamp: new Date(),
      createdAt: new Date()
    };

    const result = await collection.insertOne(document);
    console.log(`[MQTT Handler] ✅ ${sensorType} logged: ${value}${unit}`);
    
    // Update current data
    await updateCurrentData({
      device: metadata.device || 'BSF_001',
      [sensorType.replace('bsf_', '')]: value
    });
    
    return result;
  } catch (error) {
    console.error(`[MQTT Handler] ❌ Error logging ${sensorType}:`, error.message);
  }
}

/**
 * Update current BSF data
 */
async function updateCurrentData(data) {
  try {
    const db = await getDB();
    const collection = db.collection('bsf_current_data');
    
    const document = {
      device: data.device || 'BSF_001',
      temperature: data.temperature || null,
      humidity: data.humidity || null,
      air_quality: data.air_quality || null,
      fan_state: data.fan_state || null,
      fan_mode: data.fan_mode || null,
      timestamp: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { device: document.device },
      { $set: document },
      { upsert: true }
    );

    console.log('[MQTT Handler] ✅ BSF current data updated');
    return result;
  } catch (error) {
    console.error('[MQTT Handler] ❌ Error updating BSF current data:', error.message);
  }
}

/**
 * Log control action
 */
async function logControlAction(action, metadata = {}) {
  try {
    const db = await getDB();
    const collection = db.collection('control_logs');
    
    const document = {
      action: action,
      device: metadata.device || 'BSF_001',
      state: metadata.state || null,
      mode: metadata.mode || null,
      timestamp: new Date(),
      createdAt: new Date()
    };

    const result = await collection.insertOne(document);
    console.log(`[MQTT Handler] ✅ Control action logged: ${action}`);
    return result;
  } catch (error) {
    console.error('[MQTT Handler] ❌ Error logging control action:', error.message);
  }
}

module.exports = {
  initializeCollections,
  initializeBsfHandlers,
  initMQTTHandlers,
  logSensorReading,
  updateCurrentData,
  logControlAction
};