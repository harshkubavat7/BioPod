const express = require('express');
const router = express.Router();
const bsfService = require('../services/bsf.service');

// ═════════════════════════════════════════════════════════════════════════════
// GET - Current Sensor Data
// GET /api/bsf/current
// ═════════════════════════════════════════════════════════════════════════════

router.get('/current', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const data = await bsfService.getCurrentData(deviceId);
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// GET - Sensor History
// GET /api/bsf/history?sensor_type=temperature&hours=24
// ═════════════════════════════════════════════════════════════════════════════

router.get('/history', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const sensorType = req.query.sensor_type;
    const hours = parseInt(req.query.hours) || 24;
    
    if (!sensorType) {
      return res.status(400).json({
        success: false,
        error: 'sensor_type is required'
      });
    }
    
    const history = await bsfService.getSensorHistory(deviceId, sensorType, hours);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// GET - Statistics
// GET /api/bsf/statistics?hours=24
// ═════════════════════════════════════════════════════════════════════════════

router.get('/statistics', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const hours = parseInt(req.query.hours) || 24;
    
    const stats = await bsfService.getStatistics(deviceId, hours);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// GET - Configuration
// GET /api/bsf/config
// ═════════════════════════════════════════════════════════════════════════════

router.get('/config', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const config = await bsfService.getConfig(deviceId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// PUT - Update Configuration
// PUT /api/bsf/config
// Body: { "thresholds": { "mq_high": 1800, "mq_low": 1600 } }
// ═════════════════════════════════════════════════════════════════════════════

router.put('/config', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const updates = req.body;
    
    const config = await bsfService.updateConfig(deviceId, updates);
    
    res.json({
      success: true,
      message: 'Config updated',
      data: config
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// POST - Fan Control Command
// POST /api/bsf/control/fan
// Body: { "command": "ON|OFF|AUTO" }
// ═════════════════════════════════════════════════════════════════════════════

router.post('/control/fan', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const { command } = req.body;
    
    if (!['ON', 'OFF', 'AUTO'].includes(command)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid command. Use: ON, OFF, or AUTO'
      });
    }
    
    // Send command via MQTT
    await bsfService.sendFanControl(deviceId, command);
    
    // Log event
    await bsfService.logEvent(deviceId, `manual_${command.toLowerCase()}`, {
      command: command
    }, 'api');
    
    res.json({
      success: true,
      message: `Fan command sent: ${command}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// GET - Events Log
// GET /api/bsf/events?limit=50
// ═════════════════════════════════════════════════════════════════════════════

router.get('/events', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'BSF_001';
    const limit = parseInt(req.query.limit) || 50;
    
    const { BsfEvent } = require('../models/bsf.model');
    const events = await BsfEvent.find({ device_id: deviceId })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('[BSF Routes] ❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═════════════════════════════════════════════════════════════════════════════

router.use((err, req, res, next) => {
  console.error('[BSF Routes] ❌ Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;