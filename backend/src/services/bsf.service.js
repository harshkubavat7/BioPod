/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐝 BSF SERVICE - bsf.service.js
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * File: backend/src/services/bsf.service.js
 * Purpose: Business logic for BSF monitoring system
 * 
 * This service handles:
 * - Data retrieval & filtering
 * - Statistics calculation
 * - MQTT command publishing
 * - Event logging
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { getDB } = require('../config/db');
const { getMQTTClient } = require('../config/mqtt');

const DEVICE_ID = 'BSF_001';
const COLLECTION_LOGS = 'bsf_logs';
const COLLECTION_CONFIG = 'bsf_config';
const COLLECTION_EVENTS = 'bsf_events';

// ═══════════════════════════════════════════════════════════════════════════
// GET LATEST READINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the most recent sensor readings
 * Returns: Object with latest temp, humidity, air quality, fan state
 */

async function getLatestReadings() {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_LOGS);

    // Find the most recent document
    const latestReading = await collection
      .find({ device: DEVICE_ID })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latestReading.length === 0) {
      return {
        device: DEVICE_ID,
        status: 'no_data',
        message: 'No readings found'
      };
    }

    const reading = latestReading[0];

    return {
      device: reading.device,
      timestamp: reading.timestamp,
      temperature: reading.temperature,
      humidity: reading.humidity,
      airQuality: reading.airQuality,
      fanState: reading.fanState,
      fanMode: reading.fanMode,
      lastUpdate: reading.createdAt
    };
  } catch (error) {
    console.error('[BSF Service] Error in getLatestReadings:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET READINGS IN RANGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get sensor readings within a time range
 * 
 * Parameters:
 *   - startDate: ISO date string or Date object
 *   - endDate: ISO date string or Date object
 *   - limit: Number of records to return
 * 
 * Returns: Array of readings
 */

async function getReadingsInRange(startDate, endDate, limit = 100) {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_LOGS);

    // Build query
    const query = { device: DEVICE_ID };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate).getTime();
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate).getTime();
      }
    }

    // Fetch readings
    const readings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return readings.map(doc => ({
      device: doc.device,
      timestamp: doc.timestamp,
      temperature: doc.temperature,
      humidity: doc.humidity,
      airQuality: doc.airQuality,
      fanState: doc.fanState,
      fanMode: doc.fanMode,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('[BSF Service] Error in getReadingsInRange:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET DEVICE STATUS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current device status and recent statistics
 * Returns: Object with device info, current state, and 24h stats
 */

async function getDeviceStatus() {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_LOGS);

    // Get latest reading
    const latest = await getLatestReadings();

    // Get 24-hour statistics
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const stats = await collection
      .aggregate([
        {
          $match: {
            device: DEVICE_ID,
            timestamp: { $gte: oneDayAgo.getTime() }
          }
        },
        {
          $group: {
            _id: null,
            avgTemp: { $avg: '$temperature' },
            maxTemp: { $max: '$temperature' },
            minTemp: { $min: '$temperature' },
            avgHumidity: { $avg: '$humidity' },
            maxHumidity: { $max: '$humidity' },
            minHumidity: { $min: '$humidity' },
            avgAirQuality: { $avg: '$airQuality' },
            maxAirQuality: { $max: '$airQuality' },
            minAirQuality: { $min: '$airQuality' },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const statsData = stats[0] || {};

    return {
      deviceId: DEVICE_ID,
      online: true,
      lastUpdate: latest.lastUpdate,
      current: {
        temperature: latest.temperature,
        humidity: latest.humidity,
        airQuality: latest.airQuality,
        fanState: latest.fanState,
        fanMode: latest.fanMode
      },
      last24hours: {
        temperature: {
          avg: Math.round(statsData.avgTemp * 100) / 100,
          max: Math.round(statsData.maxTemp * 100) / 100,
          min: Math.round(statsData.minTemp * 100) / 100
        },
        humidity: {
          avg: Math.round(statsData.avgHumidity * 100) / 100,
          max: Math.round(statsData.maxHumidity * 100) / 100,
          min: Math.round(statsData.minHumidity * 100) / 100
        },
        airQuality: {
          avg: Math.round(statsData.avgAirQuality),
          max: statsData.maxAirQuality,
          min: statsData.minAirQuality
        },
        readingCount: statsData.count
      }
    };
  } catch (error) {
    console.error('[BSF Service] Error in getDeviceStatus:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEND FAN CONTROL COMMAND
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send fan control command via MQTT
 * 
 * Parameters:
 *   - command: "ON", "OFF", or "AUTO"
 * 
 * Publishes to: biopod/bsf/control/fan
 */

async function sendFanControl(command) {
  try {
    const client = getMQTTClient();

    if (!client || !client.connected) {
      throw new Error('MQTT client not connected');
    }

    const payload = JSON.stringify({
      device: DEVICE_ID,
      command: command,
      timestamp: Date.now()
    });

    const topic = 'biopod/bsf/control/fan';

    return new Promise((resolve, reject) => {
      client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[BSF Service] Fan control command sent: ${command}`);
          resolve({ success: true, command: command });
        }
      });
    });
  } catch (error) {
    console.error('[BSF Service] Error in sendFanControl:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEND THRESHOLD UPDATE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send threshold settings update via MQTT
 * 
 * Parameters:
 *   - settings: { mq_high: number, mq_low: number }
 */

async function sendThresholdUpdate(settings) {
  try {
    const client = getMQTTClient();

    if (!client || !client.connected) {
      throw new Error('MQTT client not connected');
    }

    const payload = JSON.stringify({
      device: DEVICE_ID,
      mq_high: settings.mq_high,
      mq_low: settings.mq_low,
      timestamp: Date.now()
    });

    const topic = 'biopod/bsf/settings/thresholds';

    return new Promise((resolve, reject) => {
      client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('[BSF Service] Threshold settings sent');
          resolve({ success: true, settings: settings });
        }
      });
    });
  } catch (error) {
    console.error('[BSF Service] Error in sendThresholdUpdate:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE THRESHOLDS IN DATABASE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update and store threshold settings in MongoDB
 */

async function updateThresholds(mq_high, mq_low) {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_CONFIG);

    const result = await collection.updateOne(
      { device: DEVICE_ID, type: 'THRESHOLDS' },
      {
        $set: {
          device: DEVICE_ID,
          type: 'THRESHOLDS',
          mq_high: mq_high,
          mq_low: mq_low,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('[BSF Service] Thresholds updated in database');

    return {
      mq_high: mq_high,
      mq_low: mq_low,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('[BSF Service] Error in updateThresholds:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate statistics for specified number of days
 * 
 * Parameters:
 *   - days: Number of days to analyze
 */

async function getStatistics(days = 7) {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_LOGS);

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get all readings in range
    const readings = await collection
      .find({
        device: DEVICE_ID,
        timestamp: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime()
        }
      })
      .toArray();

    if (readings.length === 0) {
      return {
        period_days: days,
        reading_count: 0,
        message: 'No data for this period'
      };
    }

    // Calculate statistics
    const temperatures = readings.map(r => r.temperature);
    const humidities = readings.map(r => r.humidity);
    const airQualities = readings.map(r => r.airQuality);
    const fanOnCount = readings.filter(r => r.fanState === 'ON').length;

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = (arr) => Math.max(...arr);
    const min = (arr) => Math.min(...arr);

    return {
      period_days: days,
      reading_count: readings.length,
      temperature: {
        avg: Math.round(avg(temperatures) * 100) / 100,
        max: Math.round(max(temperatures) * 100) / 100,
        min: Math.round(min(temperatures) * 100) / 100
      },
      humidity: {
        avg: Math.round(avg(humidities) * 100) / 100,
        max: Math.round(max(humidities) * 100) / 100,
        min: Math.round(min(humidities) * 100) / 100
      },
      airQuality: {
        avg: Math.round(avg(airQualities)),
        max: max(airQualities),
        min: min(airQualities)
      },
      fanRuntime: {
        on_count: fanOnCount,
        on_percentage: Math.round((fanOnCount / readings.length) * 100)
      }
    };
  } catch (error) {
    console.error('[BSF Service] Error in getStatistics:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOG EVENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log an event (control command, setting change, etc.)
 * 
 * Parameters:
 *   - event: Object with event details
 */

async function logEvent(event) {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_EVENTS);

    const eventDoc = {
      device: DEVICE_ID,
      type: event.type,
      action: event.action,
      ...event,
      createdAt: new Date()
    };

    await collection.insertOne(eventDoc);

    console.log('[BSF Service] Event logged:', event.action);

    return eventDoc;
  } catch (error) {
    console.error('[BSF Service] Error in logEvent:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get recent events
 * 
 * Parameters:
 *   - limit: Number of events to return
 */

async function getEvents(limit = 50) {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_EVENTS);

    const events = await collection
      .find({ device: DEVICE_ID })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return events.map(doc => ({
      type: doc.type,
      action: doc.action,
      timestamp: doc.createdAt,
      details: {
        command: doc.command,
        mq_high: doc.mq_high,
        mq_low: doc.mq_low
      }
    }));
  } catch (error) {
    console.error('[BSF Service] Error in getEvents:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS SENSOR READING (Called by MQTT Handler)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process incoming sensor reading from Arduino
 * Called by mqtt.handler.js
 * 
 * Parameters:
 *   - reading: { temperature, humidity, airQuality, fanState, fanMode }
 */

async function processSensorReading(reading) {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION_LOGS);

    // Validate reading
    if (typeof reading.temperature !== 'number' ||
        typeof reading.humidity !== 'number' ||
        typeof reading.airQuality !== 'number') {
      throw new Error('Invalid sensor reading format');
    }

    // Create document
    const document = {
      device: DEVICE_ID,
      temperature: reading.temperature,
      humidity: reading.humidity,
      airQuality: reading.airQuality,
      fanState: reading.fanState || 'UNKNOWN',
      fanMode: reading.fanMode || 'UNKNOWN',
      timestamp: reading.timestamp || Date.now(),
      createdAt: new Date()
    };

    // Insert into database
    const result = await collection.insertOne(document);

    console.log('[BSF Service] Sensor reading stored:', result.insertedId);

    return document;
  } catch (error) {
    console.error('[BSF Service] Error in processSensorReading:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  getLatestReadings,
  getReadingsInRange,
  getDeviceStatus,
  sendFanControl,
  sendThresholdUpdate,
  updateThresholds,
  getStatistics,
  logEvent,
  getEvents,
  processSensorReading
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATABASE COLLECTIONS REQUIRED
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service uses these MongoDB collections:
 * 
 * 1. bsf_logs
 *    Stores sensor readings
 *    {
 *      device: String,
 *      temperature: Number,
 *      humidity: Number,
 *      airQuality: Number,
 *      fanState: String (ON/OFF),
 *      fanMode: String (AUTO/MANUAL),
 *      timestamp: Number (milliseconds),
 *      createdAt: Date
 *    }
 * 
 * 2. bsf_config
 *    Stores settings and thresholds
 *    {
 *      device: String,
 *      type: String (THRESHOLDS),
 *      mq_high: Number,
 *      mq_low: Number,
 *      updatedAt: Date
 *    }
 * 
 * 3. bsf_events
 *    Stores control events and changes
 *    {
 *      device: String,
 *      type: String (CONTROL, SETTINGS),
 *      action: String (FAN_COMMAND, THRESHOLD_UPDATE),
 *      command: String,
 *      mq_high: Number,
 *      mq_low: Number,
 *      createdAt: Date
 *    }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */