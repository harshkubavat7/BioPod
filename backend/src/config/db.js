// backend/src/config/db.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'biopod_database';

let cachedClient = null;
let cachedDb = null;

async function connectDB(mongoUri) {
  if (cachedDb) {
    console.log('[DB] Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }
  cachedClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    });

    // console.log('[DB] Creating new MongoDB connection...');
    
    cachedClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    });

    await cachedClient.connect();
    cachedDb = cachedClient.db(DB_NAME);

    const adminDb = cachedClient.db('admin');
    await adminDb.admin().ping();

    console.log('[DB] ✅ MongoDB connected successfully');
    console.log(`[DB] 📊 Database: ${DB_NAME}`);

    return cachedDb;

  } catch (error) {
    console.error('[DB] ❌ Connection failed:', error.message);
    throw error;
  }
}

async function getDB() {
  if (!cachedDb) {
    return await connectDB();
  }
  return cachedDb;
}

async function closeDB() {
  if (cachedClient) {
    console.log('[DB] Closing MongoDB connection...');
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('[DB] ✅ MongoDB connection closed');
  }
}

async function createIndexes(db) {
  try {
    console.log('[DB] Creating indexes...');

    const sensorLogs = db.collection('sensor_logs');
    await sensorLogs.createIndex({ sensor_type: 1, timestamp: -1 });
    await sensorLogs.createIndex({ box_id: 1, timestamp: -1 });
    await sensorLogs.createIndex({ timestamp: -1 });
    console.log('[DB] ✅ sensor_logs indexes created');

    const controlLogs = db.collection('control_logs');
    await controlLogs.createIndex({ timestamp: -1 });
    await controlLogs.createIndex({ box_id: 1, timestamp: -1 });
    console.log('[DB] ✅ control_logs indexes created');

    const predictions = db.collection('predictions');
    await predictions.createIndex({ timestamp: -1 });
    await predictions.createIndex({ box_id: 1, timestamp: -1 });
    console.log('[DB] ✅ predictions indexes created');

  } catch (error) {
    console.error('[DB] Index creation warning:', error.message);
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  createIndexes,
  DB_NAME
};
