// backend/src/routes/alerts.js
const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// GET /api/alerts/unread
router.get('/unread', async (req, res) => {
  try {
    // const db = await getDB();
    // const collection = db.collection('alerts');
    const db = await getDB();
const collection = db.collection('alerts');

    const alerts = await collection
      .find({ read: false })
      .sort({ created_at: -1 })
      .toArray();

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('[Routes] Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      count: 0
    });
  }
});

// POST /api/alerts/:alertId/read
router.post('/:alertId/read', async (req, res) => {
  try {
    const db = await getDB();
    const collection = db.collection('alerts');
    const { ObjectId } = require('mongodb');

    await collection.updateOne(
      { _id: new ObjectId(req.params.alertId) },
      { $set: { read: true, updated_at: new Date() } }
    );

    res.json({ success: true, message: 'Alert marked as read' });
  } catch (error) {
    console.error('[Routes] Error marking alert as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
