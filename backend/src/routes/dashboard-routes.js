// const express = require('express');
// const router = express.Router();
// const { getDB } = require('../config/db');

// // Health check
// router.get('/health', (req, res) => {
//   res.json({ ok: true });
// });

// // Get sensor data (last 24 hours, limit 500)
// router.get('/graphs', async (req, res) => {
//   try {
//     const db = await getDB();
//     const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
//     const data = await db.collection('sensor_logs')
//       .find({ device: 'BSF_001', timestamp: { $gte: oneDayAgo } })
//       .sort({ timestamp: 1 })
//       .limit(500)
//       .toArray();

//     console.log('[Dashboard] 📊 Graphs endpoint - Returned', data.length, 'sensor readings');
//     res.json({ success: true, sensorData: data });
//   } catch (error) {
//     console.error('[Dashboard] ❌ Error fetching graphs:', error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Get CURRENT stats (real-time latest values)
// router.get('/stats', async (req, res) => {
//   try {
//     const db = await getDB();
    
//     // ✅ FIXED: Get ONLY the most recent reading for each sensor type
//     const tempResult = await db.collection('sensor_logs')
//       .findOne(
//         { device: 'BSF_001', sensor_type: 'bsf_temperature' },
//         { sort: { timestamp: -1 } }
//       );

//     const humidResult = await db.collection('sensor_logs')
//       .findOne(
//         { device: 'BSF_001', sensor_type: 'bsf_humidity' },
//         { sort: { timestamp: -1 } }
//       );

//     const aqResult = await db.collection('sensor_logs')
//       .findOne(
//         { device: 'BSF_001', sensor_type: 'bsf_air_quality' },
//         { sort: { timestamp: -1 } }
//       );

//     // Get last 24 hours for min/max/avg calculations
//     const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//     const historyData = await db.collection('sensor_logs')
//       .find({ device: 'BSF_001', timestamp: { $gte: oneDayAgo } })
//       .toArray();

//     const temps = historyData
//       .filter(d => d.sensor_type === 'bsf_temperature')
//       .map(d => d.value);
    
//     const humids = historyData
//       .filter(d => d.sensor_type === 'bsf_humidity')
//       .map(d => d.value);
    
//     const aqs = historyData
//       .filter(d => d.sensor_type === 'bsf_air_quality')
//       .map(d => d.value);

//     // Calculate stats
//     const makeStats = (arr, currentValue) => {
//       if (arr.length === 0) {
//         return { current: 0, min: 0, max: 0, avg: 0 };
//       }
//       return {
//         current: currentValue || arr[arr.length - 1] || 0,
//         min: Math.min(...arr),
//         max: Math.max(...arr),
//         avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
//       };
//     };

//     const stats = {
//       temperature: makeStats(temps, tempResult?.value),
//       humidity: makeStats(humids, humidResult?.value),
//       airQuality: makeStats(aqs, aqResult?.value)
//     };

//     console.log('[Dashboard] 📊 Stats endpoint - Latest readings:');
//     console.log('  Temp:', stats.temperature.current, '°C (24h avg:', stats.temperature.avg, ')');
//     console.log('  Humidity:', stats.humidity.current, '% (24h avg:', stats.humidity.avg, ')');
//     console.log('  Air Quality:', stats.airQuality.current, 'ppm (24h avg:', stats.airQuality.avg, ')');

//     res.json({ success: true, stats });
//   } catch (err) {
//     console.error('[Dashboard] ❌ Error fetching stats:', err.message);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching stats',
//       error: err.message
//     });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// ✅ NEW: Get REAL-TIME data from current_data collection
router.get('/stats', async (req, res) => {
  try {
    const db = await getDB();
    
    // Get the latest current data
    const currentData = await db.collection('bsf_current_data')
      .findOne({ device: 'BSF_001' });

    console.log('[Dashboard] 📊 Current data:', currentData);

    // Get 24h history for min/max/avg
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const historyData = await db.collection('sensor_logs')
      .find({ device: 'BSF_001', timestamp: { $gte: oneDayAgo } })
      .toArray();

    const temps = historyData
      .filter(d => d.sensor_type === 'bsf_temperature')
      .map(d => d.value);
    
    const humids = historyData
      .filter(d => d.sensor_type === 'bsf_humidity')
      .map(d => d.value);
    
    const aqs = historyData
      .filter(d => d.sensor_type === 'bsf_air_quality')
      .map(d => d.value);

    // Build stats object
    const stats = {
      temperature: {
        current: currentData?.temperature || 0,
        min: temps.length > 0 ? Math.min(...temps) : 0,
        max: temps.length > 0 ? Math.max(...temps) : 0,
        avg: temps.length > 0 ? +(temps.reduce((a, b) => a + b) / temps.length).toFixed(1) : 0
      },
      humidity: {
        current: currentData?.humidity || 0,
        min: humids.length > 0 ? Math.min(...humids) : 0,
        max: humids.length > 0 ? Math.max(...humids) : 0,
        avg: humids.length > 0 ? +(humids.reduce((a, b) => a + b) / humids.length).toFixed(1) : 0
      },
      airQuality: {
        current: currentData?.air_quality || 0,
        min: aqs.length > 0 ? Math.min(...aqs) : 0,
        max: aqs.length > 0 ? Math.max(...aqs) : 0,
        avg: aqs.length > 0 ? +(aqs.reduce((a, b) => a + b) / aqs.length).toFixed(1) : 0
      }
    };

    console.log('[Dashboard] 📊 LIVE Stats:');
    console.log('  🌡️  Temp:', stats.temperature.current, '°C');
    console.log('  💧 Humidity:', stats.humidity.current, '%');
    console.log('  🌫️  AQ:', stats.airQuality.current, 'ppm');

    res.json({ success: true, stats });
  } catch (err) {
    console.error('[Dashboard] ❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get graphs data
router.get('/graphs', async (req, res) => {
  try {
    const db = await getDB();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const data = await db.collection('sensor_logs')
      .find({ device: 'BSF_001', timestamp: { $gte: oneDayAgo } })
      .sort({ timestamp: 1 })
      .toArray();

    console.log('[Dashboard] 📊 Returned', data.length, 'sensor readings');
    res.json({ success: true, sensorData: data });
  } catch (error) {
    console.error('[Dashboard] ❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Debug endpoint - check current data
router.get('/debug/current-data', async (req, res) => {
  try {
    const db = await getDB();
    const data = await db.collection('bsf_current_data').findOne({ device: 'BSF_001' });
    console.log('[Debug] Current data in DB:', data);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
