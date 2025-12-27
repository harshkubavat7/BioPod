// backend/src/services/sensor.service.js
// Sensor Data Service Layer
// Business logic for sensor operations

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

/**
 * Get latest sensor reading by type
 * 
 * @param {string} sensorType - Type of sensor (temperature, humidity, etc.)
 * @returns {Promise<Object>} Latest sensor reading
 */
async function getLatestSensor(sensorType) {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    // Query: Find latest reading of this sensor type
    const result = await collection.findOne(
      { sensor_type: sensorType },
      { sort: { timestamp: -1 } }
    );

    if (!result) {
      return null;
    }

    // Format response
    return {
      _id: result._id.toString(),
      box_id: result.box_id,
      sensor_type: result.sensor_type,
      value: result.value,
      unit: result.unit || 'unknown',
      timestamp: result.timestamp,
      age_seconds: Math.floor((Date.now() - result.timestamp.getTime()) / 1000)
    };

  } catch (error) {
    console.error('[SensorService] Get latest error:', error.message);
    throw error;
  }
}

/**
 * Get sensor readings history
 * 
 * @param {string} sensorType - Type of sensor
 * @param {number} limit - Number of records to fetch (default 100)
 * @param {number} skip - Number of records to skip (default 0)
 * @returns {Promise<Array>} Array of sensor readings
 */
async function getSensorHistory(sensorType, limit = 100, skip = 0) {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    // Query: Find all readings of this type, sorted by time
    const results = await collection
      .find({ sensor_type: sensorType })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format results
    return results.map(doc => ({
      _id: doc._id.toString(),
      box_id: doc.box_id,
      sensor_type: doc.sensor_type,
      value: doc.value,
      unit: doc.unit || 'unknown',
      timestamp: doc.timestamp
    }));

  } catch (error) {
    console.error('[SensorService] Get history error:', error.message);
    throw error;
  }
}

/**
 * Log new sensor reading
 * 
 * @param {Object} data - Sensor reading data
 *   @param {string} data.box_id - BioPod box ID
 *   @param {string} data.sensor_type - Type of sensor
 *   @param {number} data.value - Reading value
 *   @param {string} data.unit - Unit of measurement (optional)
 * @returns {Promise<Object>} Inserted document info
 */
async function logSensorReading(data) {
  try {
    // Validate input
    if (!data.box_id || !data.sensor_type || data.value === undefined) {
      throw new Error('Missing required fields: box_id, sensor_type, value');
    }

    const db = await getDB();
    const collection = db.collection('sensor_logs');

    // Prepare document
    const document = {
      box_id: data.box_id,
      sensor_type: data.sensor_type,
      value: parseFloat(data.value),
      unit: data.unit || 'unknown',
      timestamp: new Date(),
      raw_value: data.raw_value || null,
      metadata: data.metadata || {}
    };

    // Insert document
    const result = await collection.insertOne(document);

    console.log(`[SensorService] Logged ${data.sensor_type} reading for ${data.box_id}`);

    // Format response
    return {
      success: true,
      inserted_id: result.insertedId.toString(),
      document: document
    };

  } catch (error) {
    console.error('[SensorService] Log reading error:', error.message);
    throw error;
  }
}

/**
 * Get all sensor types for a box
 * 
 * @param {string} boxId - BioPod box ID
 * @returns {Promise<Array>} List of unique sensor types
 */
async function getSensorTypes(boxId) {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    const types = await collection.distinct(
      'sensor_type',
      { box_id: boxId }
    );

    return types;

  } catch (error) {
    console.error('[SensorService] Get sensor types error:', error.message);
    throw error;
  }
}

/**
 * Get average sensor value over time period
 * 
 * @param {string} sensorType - Type of sensor
 * @param {number} minutesBack - How many minutes back to calculate
 * @returns {Promise<number>} Average value
 */
async function getAverageSensorValue(sensorType, minutesBack = 60) {
  try {
    const db = await getDB();
    const collection = db.collection('sensor_logs');

    // Calculate time range
    const startTime = new Date(Date.now() - minutesBack * 60 * 1000);

    // Use aggregation pipeline for average
    const result = await collection.aggregate([
      {
        $match: {
          sensor_type: sensorType,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$value' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    if (result.length === 0) {
      return null;
    }

    return {
      average: result.average,
      count: result.count,
      period_minutes: minutesBack
    };

  } catch (error) {
    console.error('[SensorService] Get average error:', error.message);
    throw error;
  }
}

module.exports = {
  getLatestSensor,
  getSensorHistory,
  logSensorReading,
  getSensorTypes,
  getAverageSensorValue
};
