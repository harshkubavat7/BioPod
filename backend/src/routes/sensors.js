// backend/src/routes/sensors.js
// Sensor API Routes
// Endpoints for sensor data operations

const express = require('express');
const router = express.Router();
const sensorService = require('../services/sensor.service');

// ============================================
// GET LATEST SENSOR READING
// ============================================

/**
 * GET /api/sensors/latest
 * Get latest reading for a sensor type
 * 
 * Query parameters:
 *   type (required) - Sensor type (temperature, humidity, etc.)
 * 
 * Example: GET /api/sensors/latest?type=temperature
 */
router.get('/latest', async (req, res) => {
  try {
    const { type } = req.query;

    // Validate input
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: type',
        message: 'Please provide ?type=... query parameter',
        example: '/api/sensors/latest?type=temperature'
      });
    }

    // Get latest reading
    const data = await sensorService.getLatestSensor(type);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `No readings found for sensor type: ${type}`,
        type: type
      });
    }

    res.status(200).json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SensorRoute] Latest error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest reading',
      message: error.message
    });
  }
});

// ============================================
// GET SENSOR HISTORY
// ============================================

/**
 * GET /api/sensors/history
 * Get reading history for a sensor type
 * 
 * Query parameters:
 *   type (required) - Sensor type
 *   limit (optional) - Number of records (default 100, max 1000)
 *   skip (optional) - Number to skip for pagination (default 0)
 * 
 * Example: GET /api/sensors/history?type=temperature&limit=50&skip=0
 */
router.get('/history', async (req, res) => {
  try {
    const { type, limit = 100, skip = 0 } = req.query;

    // Validate input
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: type',
        example: '/api/sensors/history?type=temperature&limit=100'
      });
    }

    // Validate limit (prevent too large queries)
    const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
    const parsedSkip = Math.max(parseInt(skip) || 0, 0);

    // Get history
    const data = await sensorService.getSensorHistory(type, parsedLimit, parsedSkip);

    res.status(200).json({
      success: true,
      count: data.length,
      limit: parsedLimit,
      skip: parsedSkip,
      data: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SensorRoute] History error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

// ============================================
// LOG NEW SENSOR READING
// ============================================

/**
 * POST /api/sensors/log
 * Save a new sensor reading
 * 
 * Body parameters (JSON):
 *   box_id (required) - BioPod box ID
 *   sensor_type (required) - Type of sensor
 *   value (required) - Reading value
 *   unit (optional) - Unit of measurement
 * 
 * Example:
 * POST /api/sensors/log
 * {
 *   "box_id": "biopod_001",
 *   "sensor_type": "temperature",
 *   "value": 29.5,
 *   "unit": "°C"
 * }
 */
router.post('/log', async (req, res) => {
  try {
    const { box_id, sensor_type, value, unit } = req.body;

    // Validate required fields
    if (!box_id || !sensor_type || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['box_id', 'sensor_type', 'value'],
        optional: ['unit'],
        received: { box_id, sensor_type, value, unit }
      });
    }

    // Validate value is a number
    if (typeof value !== 'number' && isNaN(parseFloat(value))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid value',
        message: 'value must be a number'
      });
    }

    // Log reading
    const result = await sensorService.logSensorReading({
      box_id,
      sensor_type,
      value: parseFloat(value),
      unit
    });

    res.status(201).json({
      success: true,
      message: 'Reading logged successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SensorRoute] Log error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to log reading',
      message: error.message
    });
  }
});

// ============================================
// GET SENSOR TYPES
// ============================================

/**
 * GET /api/sensors/types
 * Get all sensor types for a box
 * 
 * Query parameters:
 *   box_id (required) - BioPod box ID
 * 
 * Example: GET /api/sensors/types?box_id=biopod_001
 */
router.get('/types', async (req, res) => {
  try {
    const { box_id } = req.query;

    if (!box_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: box_id'
      });
    }

    const types = await sensorService.getSensorTypes(box_id);

    res.status(200).json({
      success: true,
      box_id: box_id,
      types: types,
      count: types.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SensorRoute] Types error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor types',
      message: error.message
    });
  }
});

// ============================================
// GET AVERAGE SENSOR VALUE
// ============================================

/**
 * GET /api/sensors/average
 * Get average value over time period
 * 
 * Query parameters:
 *   type (required) - Sensor type
 *   minutes (optional) - Minutes back (default 60, max 1440)
 * 
 * Example: GET /api/sensors/average?type=temperature&minutes=60
 */
router.get('/average', async (req, res) => {
  try {
    const { type, minutes = 60 } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: type'
      });
    }

    const parsedMinutes = Math.min(parseInt(minutes) || 60, 1440); // Max 24 hours

    const avg = await sensorService.getAverageSensorValue(type, parsedMinutes);

    if (!avg) {
      return res.status(404).json({
        success: false,
        error: 'No data available',
        message: `No readings found for the last ${parsedMinutes} minutes`
      });
    }

    res.status(200).json({
      success: true,
      type: type,
      average: avg.average,
      data_points: avg.count,
      period_minutes: parsedMinutes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SensorRoute] Average error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate average',
      message: error.message
    });
  }
});

module.exports = router;
