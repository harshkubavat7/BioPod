/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 MQTT SERVICE MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * File: backend/src/services/mqtt.service.js
 * Purpose: Business logic for processing sensor readings
 * Features:
 *   - Sensor reading validation
 *   - Data transformation
 *   - MongoDB integration
 *   - Query operations
 *   - Error handling
 *   - Logging
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { getDB } = require('../config/db');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════

const SENSOR_RANGES = {
  temperature: { min: -40, max: 80, unit: '°C' },
  humidity: { min: 0, max: 100, unit: '%' },
  light: { min: 0, max: 4095, unit: 'lux' },
  soil_moisture: { min: 0, max: 100, unit: '%' },
  co2: { min: 0, max: 2000, unit: 'ppm' }
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate sensor reading
 * Checks if value is within acceptable range
 * 
 * @param {string} sensorType - Type of sensor
 * @param {number} value - Sensor reading value
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateReading(sensorType, value) {
  // Check if sensor type is known
  if (!SENSOR_RANGES[sensorType]) {
    return {
      isValid: false,
      error: `Unknown sensor type: ${sensorType}`
    };
  }

  // Check if value is a number
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      isValid: false,
      error: `Invalid value: not a number`
    };
  }

  const range = SENSOR_RANGES[sensorType];

  // Check if value is within range
  if (value < range.min || value > range.max) {
    return {
      isValid: false,
      error: `Value ${value} out of range [${range.min}, ${range.max}]`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PROCESS SENSOR READING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Process and store sensor reading
 * Validates and saves reading to MongoDB
 * 
 * @param {Object} reading - Sensor reading object
 * @param {string} reading.box_id - Device ID (e.g., "BOX_001")
 * @param {string} reading.sensor_type - Type of sensor
 * @param {number} reading.value - Sensor value
 * @param {string} reading.unit - Unit of measurement
 * @param {Date} reading.timestamp - Timestamp of reading
 * @returns {Promise<Object>} Inserted document
 */
async function processSensorReading(reading) {
  try {
    // ═════════════════════════════════════════════════════════════════
    // VALIDATE READING
    // ═════════════════════════════════════════════════════════════════
    const validation = validateReading(reading.sensor_type, reading.value);

    if (!validation.isValid) {
      console.error(
        `[MQTT Service] ❌ Validation failed for ${reading.sensor_type}: ${validation.error}`
      );
      return {
        success: false,
        error: validation.error
      };
    }

    // ═════════════════════════════════════════════════════════════════
    // PREPARE DOCUMENT
    // ═════════════════════════════════════════════════════════════════
    const document = {
      box_id: reading.box_id || 'BOX_001',
      sensor_type: reading.sensor_type,
      value: parseFloat(reading.value),
      unit: reading.unit,
      timestamp: reading.timestamp || new Date(),
      status: 'valid',
      createdAt: new Date()
    };

    // ═════════════════════════════════════════════════════════════════
    // INSERT INTO DATABASE
    // ═════════════════════════════════════════════════════════════════
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    const result = await collection.insertOne(document);

    console.log(
      `[MQTT Service] ✅ ${reading.sensor_type} saved: ${reading.value} ${reading.unit}`
    );

    return {
      success: true,
      id: result.insertedId,
      document: document
    };

  } catch (error) {
    console.error('[MQTT Service] ❌ Error processing reading:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET LATEST READING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get latest reading for a sensor type
 * 
 * @param {string} sensorType - Type of sensor
 * @param {string} boxId - Device ID (optional)
 * @returns {Promise<Object>} Latest reading or null
 */
async function getLatestReading(sensorType, boxId = 'BOX_001') {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    const reading = await collection
      .findOne(
        {
          sensor_type: sensorType,
          box_id: boxId
        },
        {
          sort: { timestamp: -1 }
        }
      );

    return reading;

  } catch (error) {
    console.error('[MQTT Service] ❌ Error getting latest reading:', error.message);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET READINGS IN DATE RANGE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get readings within a date range
 * 
 * @param {string} sensorType - Type of sensor
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} boxId - Device ID (optional)
 * @returns {Promise<Array>} Array of readings
 */
async function getReadingsInRange(sensorType, startDate, endDate, boxId = 'BOX_001') {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    const readings = await collection
      .find({
        sensor_type: sensorType,
        box_id: boxId,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ timestamp: -1 })
      .toArray();

    return readings;

  } catch (error) {
    console.error('[MQTT Service] ❌ Error getting readings in range:', error.message);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET ALL ACTIVE SENSORS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all active sensors (with recent readings)
 * 
 * @param {number} minutesAgo - Consider reading active if within N minutes
 * @returns {Promise<Object>} Map of sensor types to latest values
 */
async function getActiveSensors(minutesAgo = 5) {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);

    // Get latest reading for each sensor type
    const sensorTypes = ['temperature', 'humidity', 'light', 'soil_moisture', 'co2'];
    const activeSensors = {};

    for (const sensorType of sensorTypes) {
      const reading = await collection
        .findOne(
          {
            sensor_type: sensorType,
            timestamp: { $gte: cutoffTime }
          },
          {
            sort: { timestamp: -1 }
          }
        );

      if (reading) {
        activeSensors[sensorType] = {
          value: reading.value,
          unit: reading.unit,
          timestamp: reading.timestamp,
          box_id: reading.box_id,
          isActive: true
        };
      } else {
        activeSensors[sensorType] = {
          isActive: false
        };
      }
    }

    return activeSensors;

  } catch (error) {
    console.error('[MQTT Service] ❌ Error getting active sensors:', error.message);
    return {};
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET SENSOR STATISTICS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get statistics for a sensor (min, max, avg)
 * 
 * @param {string} sensorType - Type of sensor
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} boxId - Device ID (optional)
 * @returns {Promise<Object>} Statistics object
 */
async function getSensorStats(sensorType, startDate, endDate, boxId = 'BOX_001') {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    const stats = await collection
      .aggregate([
        {
          $match: {
            sensor_type: sensorType,
            box_id: boxId,
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$sensor_type',
            min: { $min: '$value' },
            max: { $max: '$value' },
            avg: { $avg: '$value' },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    return stats.length > 0 ? stats[0] : null;

  } catch (error) {
    console.error('[MQTT Service] ❌ Error getting sensor stats:', error.message);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  processSensorReading,
  getLatestReading,
  getReadingsInRange,
  getActiveSensors,
  getSensorStats,
  validateReading,
  SENSOR_RANGES
};

/**
 * USAGE EXAMPLES:
 * 
 * // Process a reading
 * const { processSensorReading } = require('./services/mqtt.service');
 * await processSensorReading({
 *   box_id: 'BOX_001',
 *   sensor_type: 'temperature',
 *   value: 28.5,
 *   unit: '°C',
 *   timestamp: new Date()
 * });
 * 
 * // Get latest reading
 * const { getLatestReading } = require('./services/mqtt.service');
 * const latest = await getLatestReading('temperature', 'BOX_001');
 * console.log(latest);
 * 
 * // Get readings in range
 * const { getReadingsInRange } = require('./services/mqtt.service');
 * const readings = await getReadingsInRange(
 *   'temperature',
 *   new Date('2025-12-27'),
 *   new Date(),
 *   'BOX_001'
 * );
 * 
 * // Get active sensors
 * const { getActiveSensors } = require('./services/mqtt.service');
 * const active = await getActiveSensors(5); // Last 5 minutes
 * 
 * // Get statistics
 * const { getSensorStats } = require('./services/mqtt.service');
 * const stats = await getSensorStats(
 *   'temperature',
 *   new Date('2025-12-27'),
 *   new Date(),
 *   'BOX_001'
 * );
 */