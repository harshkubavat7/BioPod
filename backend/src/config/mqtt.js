// /**
//  * ═══════════════════════════════════════════════════════════════════════════
//  * 🔧 MQTT SERVICE MODULE - UPDATED
//  * ═══════════════════════════════════════════════════════════════════════════
//  */

// const { getDB } = require('../config/db');

// // ═══════════════════════════════════════════════════════════════════════════
// // VALIDATION RULES
// // ═══════════════════════════════════════════════════════════════════════════

// const SENSOR_RANGES = {
//   temperature: { min: -40, max: 80, unit: '°C' },
//   humidity: { min: 0, max: 100, unit: '%' },
//   light: { min: 0, max: 4095, unit: 'lux' },
//   soil_moisture: { min: 0, max: 100, unit: '%' },
//   co2: { min: 0, max: 2000, unit: 'ppm' },
//   air_quality: { min: 0, max: 5000, unit: 'ppm' }  // Added for BSF
// };

// // ═══════════════════════════════════════════════════════════════════════════
// // INITIALIZATION FUNCTIONS (ADDED)
// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Initialize collections and indexes
//  * This function is called from server.js
//  */
// async function initializeCollections() {
//   try {
//     const db = await getDB();
    
//     // Create indexes for sensor_logs
//     await db.collection('sensor_logs').createIndex({ timestamp: -1 });
//     await db.collection('sensor_logs').createIndex({ sensor_type: 1, timestamp: -1 });
//     await db.collection('sensor_logs').createIndex({ box_id: 1, timestamp: -1 });
    
//     // Create indexes for bsf_logs
//     await db.collection('bsf_logs').createIndex({ timestamp: -1 });
//     await db.collection('bsf_logs').createIndex({ device: 1, timestamp: -1 });
    
//     console.log('[MQTT Service] ✅ Collections initialized with indexes');
//     return true;
//   } catch (error) {
//     console.error('[MQTT Service] ❌ Failed to initialize collections:', error);
//     return false;
//   }
// }

// // ═══════════════════════════════════════════════════════════════════════════
// // VALIDATION FUNCTION
// // ═══════════════════════════════════════════════════════════════════════════

// function validateReading(sensorType, value) {
//   // Check if sensor type is known
//   if (!SENSOR_RANGES[sensorType]) {
//     return {
//       isValid: false,
//       error: `Unknown sensor type: ${sensorType}`
//     };
//   }

//   // Check if value is a number
//   if (typeof value !== 'number' || isNaN(value)) {
//     return {
//       isValid: false,
//       error: `Invalid value: not a number`
//     };
//   }

//   const range = SENSOR_RANGES[sensorType];

//   // Check if value is within range
//   if (value < range.min || value > range.max) {
//     return {
//       isValid: false,
//       error: `Value ${value} out of range [${range.min}, ${range.max}]`
//     };
//   }

//   return {
//     isValid: true,
//     error: null
//   };
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // PROCESS SENSOR READING
// // ═════════════════════════════════════════════════════════════════════════════

// async function processSensorReading(reading) {
//   try {
//     // Validate reading
//     const validation = validateReading(reading.sensor_type, reading.value);

//     if (!validation.isValid) {
//       console.error(
//         `[MQTT Service] ❌ Validation failed for ${reading.sensor_type}: ${validation.error}`
//       );
//       return {
//         success: false,
//         error: validation.error
//       };
//     }

//     // Prepare document
//     const document = {
//       box_id: reading.box_id || 'BOX_001',
//       sensor_type: reading.sensor_type,
//       value: parseFloat(reading.value),
//       unit: reading.unit || SENSOR_RANGES[reading.sensor_type]?.unit || 'N/A',
//       timestamp: reading.timestamp || new Date(),
//       status: 'valid',
//       createdAt: new Date()
//     };

//     // Insert into database
//     const db = await getDB();
//     const collection = db.collection('sensor_logs');

//     const result = await collection.insertOne(document);

//     console.log(
//       `[MQTT Service] ✅ ${reading.sensor_type} saved: ${reading.value} ${document.unit}`
//     );

//     return {
//       success: true,
//       id: result.insertedId,
//       document: document
//     };

//   } catch (error) {
//     console.error('[MQTT Service] ❌ Error processing reading:', error.message);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // PROCESS BSF READING (ADDED)
// // ═════════════════════════════════════════════════════════════════════════════

// async function processBsfReading(reading) {
//   try {
//     const db = await getDB();
//     const collection = db.collection('bsf_logs');

//     const document = {
//       device: reading.device || 'BSF_001',
//       sensor_type: reading.sensor_type || 'status',
//       value: reading.value,
//       state: reading.state,
//       mode: reading.mode,
//       unit: reading.unit || 'N/A',
//       timestamp: new Date(reading.timestamp || Date.now()),
//       createdAt: new Date()
//     };

//     const result = await collection.insertOne(document);

//     console.log(`[MQTT Service] ✅ BSF ${document.sensor_type} saved:`, {
//       value: document.value,
//       state: document.state,
//       mode: document.mode
//     });

//     return {
//       success: true,
//       id: result.insertedId,
//       document: document
//     };

//   } catch (error) {
//     console.error('[MQTT Service] ❌ Error processing BSF reading:', error.message);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // GET LATEST READING
// // ═════════════════════════════════════════════════════════════════════════════

// async function getLatestReading(sensorType, boxId = 'BOX_001') {
//   try {
//     const db = await getDB();
//     const collection = db.collection('sensor_logs');

//     const reading = await collection
//       .findOne(
//         {
//           sensor_type: sensorType,
//           box_id: boxId
//         },
//         {
//           sort: { timestamp: -1 }
//         }
//       );

//     return reading;

//   } catch (error) {
//     console.error('[MQTT Service] ❌ Error getting latest reading:', error.message);
//     return null;
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // GET READINGS IN DATE RANGE
// // ═════════════════════════════════════════════════════════════════════════════

// async function getReadingsInRange(sensorType, startDate, endDate, boxId = 'BOX_001') {
//   try {
//     const db = await getDB();
//     const collection = db.collection('sensor_logs');

//     const readings = await collection
//       .find({
//         sensor_type: sensorType,
//         box_id: boxId,
//         timestamp: {
//           $gte: startDate,
//           $lte: endDate
//         }
//       })
//       .sort({ timestamp: -1 })
//       .toArray();

//     return readings;

//   } catch (error) {
//     console.error('[MQTT Service] ❌ Error getting readings in range:', error.message);
//     return [];
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // GET ALL ACTIVE SENSORS
// // ═════════════════════════════════════════════════════════════════════════════

// async function getActiveSensors(minutesAgo = 5) {
//   try {
//     const db = await getDB();
//     const collection = db.collection('sensor_logs');

//     const cutoffTime = new Date();
//     cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);

//     const sensorTypes = ['temperature', 'humidity', 'light', 'soil_moisture', 'co2'];
//     const activeSensors = {};

//     for (const sensorType of sensorTypes) {
//       const reading = await collection
//         .findOne(
//           {
//             sensor_type: sensorType,
//             timestamp: { $gte: cutoffTime }
//           },
//           {
//             sort: { timestamp: -1 }
//           }
//         );

//       if (reading) {
//         activeSensors[sensorType] = {
//           value: reading.value,
//           unit: reading.unit,
//           timestamp: reading.timestamp,
//           box_id: reading.box_id,
//           isActive: true
//         };
//       } else {
//         activeSensors[sensorType] = {
//           isActive: false
//         };
//       }
//     }

//     return activeSensors;

//   } catch (error) {
//     console.error('[MQTT Service] ❌ Error getting active sensors:', error.message);
//     return {};
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // GET SENSOR STATISTICS
// // ═════════════════════════════════════════════════════════════════════════════

// async function getSensorStats(sensorType, startDate, endDate, boxId = 'BOX_001') {
//   try {
//     const db = await getDB();
//     const collection = db.collection('sensor_logs');

//     const stats = await collection
//       .aggregate([
//         {
//           $match: {
//             sensor_type: sensorType,
//             box_id: boxId,
//             timestamp: {
//               $gte: startDate,
//               $lte: endDate
//             }
//           }
//         },
//         {
//           $group: {
//             _id: '$sensor_type',
//             min: { $min: '$value' },
//             max: { $max: '$value' },
//             avg: { $avg: '$value' },
//             count: { $sum: 1 }
//           }
//         }
//       ])
//       .toArray();

//     return stats.length > 0 ? stats[0] : null;

//   } catch (error) {
//     console.error('[MQTT Service] ❌ Error getting sensor stats:', error.message);
//     return null;
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // EXPORTS
// // ═════════════════════════════════════════════════════════════════════════════

// module.exports = {
//   initializeCollections,        // Added
//   processSensorReading,
//   processBsfReading,           // Added
//   getLatestReading,
//   getReadingsInRange,
//   getActiveSensors,
//   getSensorStats,
//   validateReading,
//   SENSOR_RANGES
// };


const mqtt = require('mqtt');

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const MQTT_CLIENT_ID = 'biopod-backend-' + Math.random().toString(36).substr(2, 9);

const MQTT_TOPICS = [
  'biopod/sensors/temperature',
  'biopod/sensors/humidity',
  'biopod/sensors/light',
  'biopod/sensors/soil_moisture',
  'biopod/sensors/co2',
  'biopod/status',
  'biopod/bsf/sensors/temperature',
  'biopod/bsf/sensors/humidity',
  'biopod/bsf/sensors/air_quality',
  'biopod/bsf/status/fan',
  'biopod/bsf/status/online'
];

// State
let mqttClient = null;

/**
 * Connect to MQTT Broker
 */
async function connectMQTT() {
  return new Promise((resolve, reject) => {
    try {
      console.log('[MQTT] Connecting to broker...');
      console.log('[MQTT] Broker: ' + MQTT_BROKER);
      
      mqttClient = mqtt.connect(MQTT_BROKER, {
        clientId: MQTT_CLIENT_ID,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        username: process.env.MQTT_USERNAME || '',
        password: process.env.MQTT_PASSWORD || ''
      });

      mqttClient.on('connect', () => {
        console.log('[MQTT] ✅ Connected to broker');
        console.log('[MQTT] Client ID: ' + MQTT_CLIENT_ID);
        
        MQTT_TOPICS.forEach(topic => {
          mqttClient.subscribe(topic, (err) => {
            if (err) {
              console.error(`[MQTT] ❌ Error subscribing to ${topic}:`, err);
            } else {
              console.log(`[MQTT] ✅ Subscribed to ${topic}`);
            }
          });
        });
        resolve(mqttClient);
      });

      

      // mqttClient.on('message', (topic, message) => {
      //   console.log('[MQTT] Message on topic: ' + topic);
      //   console.log('[MQTT] Payload: ' + message.toString());
      // });

      mqttClient.on('message', (topic, message) => {
  console.log('[MQTT] Message on topic: ' + topic);
  console.log('[MQTT] Payload: ' + message.toString());
  
  // Handle fan control commands from chatbot
  if (topic === 'biopod/bsf/control/fan') {
    try {
      const payload = JSON.parse(message.toString());
      console.log('[MQTT Handler] 🎛️  Fan Control Command:', payload);
      
      handleFanControl(payload);
    } catch (err) {
      console.error('[MQTT Handler] Error parsing fan control:', err);
    }
  }
});


      mqttClient.on('error', (error) => {
        console.error('[MQTT] ❌ Connection error:', error.message);
        reject(error);
      });

      mqttClient.on('offline', () => {
        console.warn('[MQTT] ⚠️  Connection offline');
      });

      mqttClient.on('close', () => {
        console.log('[MQTT] ⚠️  Connection closed');
      });

      setTimeout(() => {
        reject(new Error('MQTT connection timeout'));
      }, 5000);

    } catch (error) {
      console.error('[MQTT] ❌ Error during connection setup:', error.message);
      reject(error);
    }
  });
}



/**
 * Get MQTT Client Instance
 */
function getMqttClient() {
  return mqttClient;
}

/**
 * Close MQTT Connection
 */
async function closeMQTT() {
  return new Promise((resolve) => {
    if (mqttClient) {
      mqttClient.end(() => {
        console.log('[MQTT] Connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}


/**
 * Handle fan control from chatbot
 */
// async function handleFanControl(payload) {
//   try {
//     const { device, state, mode, timestamp } = payload;
    
//     console.log(`[MQTT Handler] 💾 Saving fan control: ${device} -> ${state}`);
    
//     // Get database connection
//     const { getDB } = require('./db');
//     const database = await getDB();
    
//     // Save to control_logs
//     await database.collection('control_logs').insertOne({
//       device: device || 'BSF_001',
//       type: 'fan_control',
//       state: state,
//       mode: mode || 'MANUAL',
//       timestamp: new Date(timestamp || Date.now()),
//       source: 'chatbot',
//       saved_at: new Date()
//     });
    
//     console.log('[MQTT Handler] ✅ Fan control saved to database');
    
//   } catch (error) {
//     console.error('[MQTT Handler] Error handling fan control:', error.message);
//   }
// }


async function handleFanControl(payload) {
  try {
    const { device, state, mode, timestamp } = payload;
    
    console.log(`[MQTT Handler] 🎛️  Fan Control: ${device} -> ${state} (${mode})`);
    
    const { getDB } = require('./db');
    const database = await getDB();
    
    // Save to control_logs
    await database.collection('control_logs').insertOne({
      device: device || 'BSF_001',
      type: 'fan_control',
      state: state,
      mode: mode || 'MANUAL',
      timestamp: new Date(timestamp || Date.now()),
      source: 'chatbot',
      saved_at: new Date()
    });
    
    console.log('[MQTT Handler] ✅ Fan control saved to database');
    
  } catch (error) {
    console.error('[MQTT Handler] Error handling fan control:', error.message);
  }
}


module.exports = {
  connectMQTT,
  getMqttClient,
  closeMQTT,
  MQTT_TOPICS,
  handleFanControl
};