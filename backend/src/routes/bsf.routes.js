/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐝 BSF-SPECIFIC ROUTES - bsf.routes.js
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * File: backend/src/routes/bsf.routes.js
 * Purpose: API endpoints for BSF monitoring system
 * 
 * This file handles:
 * - Getting sensor data
 * - Getting device status
 * - Manual control commands
 * - Settings management
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const bsfService = require('../services/bsf.service');

// ═══════════════════════════════════════════════════════════════════════════
// GET LATEST SENSOR READINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/bsf/readings/latest
 * 
 * Returns: Latest readings from all sensors
 * 
 * Response:
 * {
 *   "device": "BSF_001",
 *   "timestamp": 1234567890,
 *   "temperature": 28.5,
 *   "humidity": 65.3,
 *   "airQuality": 1750,
 *   "fanState": "ON",
 *   "fanMode": "AUTO"
 * }
 */

router.get('/readings/latest', async (req, res) => {
  try {
    const readings = await bsfService.getLatestReadings();
    
    res.json({
      status: 'ok',
      data: readings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BSF Routes] Error fetching latest readings:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET READINGS IN TIME RANGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/bsf/readings?from=2025-12-27&to=2025-12-28
 * 
 * Query Parameters:
 *   - from: Start date (ISO format) - optional
 *   - to: End date (ISO format) - optional
 *   - limit: Number of records (default: 100)
 * 
 * Returns: Array of readings in time range
 */

router.get('/readings', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    
    const readings = await bsfService.getReadingsInRange(
      from ? new Date(from) : null,
      to ? new Date(to) : null,
      parseInt(limit) || 100
    );

    res.json({
      status: 'ok',
      count: readings.length,
      data: readings
    });
  } catch (error) {
    console.error('[BSF Routes] Error fetching readings:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET DEVICE STATUS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/bsf/device/status
 * 
 * Returns: Current device status and statistics
 * 
 * Response:
 * {
 *   "deviceId": "BSF_001",
 *   "online": true,
 *   "lastUpdate": "2025-12-27T19:00:00Z",
 *   "fanMode": "AUTO",
 *   "fanState": "ON",
 *   "uptime": 3600000,
 *   "stats": {
 *     "avgTemp": 28.2,
 *     "avgHumidity": 64.5,
 *     "maxAirQuality": 1850,
 *     "minAirQuality": 1200
 *   }
 * }
 */

router.get('/device/status', async (req, res) => {
  try {
    const status = await bsfService.getDeviceStatus();

    res.json({
      status: 'ok',
      data: status
    });
  } catch (error) {
    console.error('[BSF Routes] Error fetching device status:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEND FAN CONTROL COMMAND
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/bsf/control/fan
 * 
 * Body:
 * {
 *   "command": "ON"  // or "OFF" or "AUTO"
 * }
 * 
 * Valid commands:
 *   - "ON": Turn fan on manually (5-min timeout)
 *   - "OFF": Turn fan off manually (5-min timeout)
 *   - "AUTO": Return to auto mode
 * 
 * Returns: Confirmation
 */

router.post('/control/fan', async (req, res) => {
  try {
    const { command } = req.body;

    // Validate command
    const validCommands = ['ON', 'OFF', 'AUTO'];
    if (!validCommands.includes(command)) {
      return res.status(400).json({
        status: 'error',
        error: `Invalid command. Must be one of: ${validCommands.join(', ')}`
      });
    }

    // Send command via MQTT
    const result = await bsfService.sendFanControl(command);

    // Log event
    await bsfService.logEvent({
      type: 'CONTROL',
      action: 'FAN_COMMAND',
      command: command,
      timestamp: new Date()
    });

    res.json({
      status: 'ok',
      message: `Fan control command sent: ${command}`,
      command: command
    });
  } catch (error) {
    console.error('[BSF Routes] Error sending fan control:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE THRESHOLD SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/bsf/settings/thresholds
 * 
 * Body:
 * {
 *   "mq_high": 1800,
 *   "mq_low": 1600
 * }
 * 
 * Updates the MQ135 thresholds for fan control
 */

router.post('/settings/thresholds', async (req, res) => {
  try {
    const { mq_high, mq_low } = req.body;

    // Validate values
    if (typeof mq_high !== 'number' || typeof mq_low !== 'number') {
      return res.status(400).json({
        status: 'error',
        error: 'mq_high and mq_low must be numbers'
      });
    }

    if (mq_high <= mq_low) {
      return res.status(400).json({
        status: 'error',
        error: 'mq_high must be greater than mq_low'
      });
    }

    // Update settings
    const settings = await bsfService.updateThresholds(mq_high, mq_low);

    // Send to Arduino via MQTT
    await bsfService.sendThresholdUpdate({
      mq_high: mq_high,
      mq_low: mq_low
    });

    // Log event
    await bsfService.logEvent({
      type: 'SETTINGS',
      action: 'THRESHOLD_UPDATE',
      mq_high: mq_high,
      mq_low: mq_low,
      timestamp: new Date()
    });

    res.json({
      status: 'ok',
      message: 'Thresholds updated',
      settings: settings
    });
  } catch (error) {
    console.error('[BSF Routes] Error updating thresholds:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/bsf/stats?days=7
 * 
 * Query Parameters:
 *   - days: Number of days to analyze (default: 7)
 * 
 * Returns: Statistics for the specified period
 */

router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const stats = await bsfService.getStatistics(days);

    res.json({
      status: 'ok',
      period_days: days,
      data: stats
    });
  } catch (error) {
    console.error('[BSF Routes] Error fetching statistics:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET EVENTS LOG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/bsf/events?limit=50
 * 
 * Returns: Recent events (control commands, alerts, etc.)
 */

router.get('/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const events = await bsfService.getEvents(limit);

    res.json({
      status: 'ok',
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('[BSF Routes] Error fetching events:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════

router.use((err, req, res, next) => {
  console.error('[BSF Routes] Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    error: 'Internal server error'
  });
});

module.exports = router;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IMPORT IN SERVER.JS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Add to backend/src/server.js:
 * 
 * const bsfRoutes = require('./routes/bsf.routes');
 * 
 * Then in the ROUTES section:
 * 
 * app.use('/api/bsf', bsfRoutes);
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */