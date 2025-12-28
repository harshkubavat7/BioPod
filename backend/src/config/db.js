// const { MongoClient } = require('mongodb');

// const MONGO_URI = process.env.MONGO_URI;
// const DB_NAME = 'biopod_database';

// let cachedClient = null;
// let cachedDb = null;

// async function connectDB(mongoUri) {
//   if (cachedDb) {
//     console.log('[DB] Using cached MongoDB connection');
//     return cachedDb;
//   }

//   try {
//     if (!mongoUri) {
//       throw new Error('MONGO_URI is required');
//     }
    
//     console.log('[DB] Creating new MongoDB connection...');
    
//     cachedClient = new MongoClient(mongoUri, {
//       maxPoolSize: 10,
//       minPoolSize: 2,
//     //   retryWrites: true,
//      tlsAllowInvalidCertificates: true,
//   retryWrites: false,
//       w: 'majority',
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000
//     });

//     await cachedClient.connect();
//     cachedDb = cachedClient.db(DB_NAME);

//     // Test connection
//     await cachedDb.command({ ping: 1 });
    
//     console.log('[DB] ✅ MongoDB connected successfully');
//     console.log(`[DB] 📊 Database: ${DB_NAME}`);

//     return cachedDb;

//   } catch (error) {
//     console.error('[DB] ❌ Connection failed:', error.message);
//     throw error;
//   }
// }

// async function getDB() {
//   if (!cachedDb) {
//     throw new Error('Database not connected. Call connectDB first.');
//   }
//   return cachedDb;
// }

// async function closeDB() {
//   if (cachedClient) {
//     console.log('[DB] Closing MongoDB connection...');
//     await cachedClient.close();
//     cachedClient = null;
//     cachedDb = null;
//     console.log('[DB] ✅ MongoDB connection closed');
//   }
// }

// async function createIndexes(db) {
//   try {
//     console.log('[DB] Creating indexes...');

//     // Create indexes for sensor_logs
//     const sensorLogs = db.collection('sensor_logs');
//     await sensorLogs.createIndex({ timestamp: -1 });
//     await sensorLogs.createIndex({ sensor_type: 1, timestamp: -1 });
//     await sensorLogs.createIndex({ box_id: 1, timestamp: -1 });
//     await sensorLogs.createIndex({ device: 1, timestamp: -1 });
//     console.log('[DB] ✅ sensor_logs indexes created');

//     // Create indexes for bsf_logs
//     const bsfLogs = db.collection('bsf_logs');
//     await bsfLogs.createIndex({ timestamp: -1 });
//     await bsfLogs.createIndex({ device: 1, timestamp: -1 });
//     await bsfLogs.createIndex({ sensor_type: 1, timestamp: -1 });
//     console.log('[DB] ✅ bsf_logs indexes created');

//     // Create indexes for control_logs
//     const controlLogs = db.collection('control_logs');
//     await controlLogs.createIndex({ timestamp: -1 });
//     await controlLogs.createIndex({ box_id: 1, timestamp: -1 });
//     console.log('[DB] ✅ control_logs indexes created');

//     // Create indexes for predictions
//     const predictions = db.collection('predictions');
//     await predictions.createIndex({ timestamp: -1 });
//     await predictions.createIndex({ box_id: 1, timestamp: -1 });
//     console.log('[DB] ✅ predictions indexes created');

//   } catch (error) {
//     console.error('[DB] ❌ Index creation error:', error.message);
//   }
// }

// module.exports = {
//   connectDB,
//   getDB,
//   closeDB,
//   createIndexes,
//   DB_NAME
// };


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
    
    console.log('[DB] Creating new MongoDB connection...');
    
    cachedClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      tlsAllowInvalidCertificates: true,
      retryWrites: false,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    await cachedClient.connect();
    cachedDb = cachedClient.db(DB_NAME);

    // Test connection
    await cachedDb.command({ ping: 1 });
    
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
    throw new Error('Database not connected. Call connectDB first.');
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

    // Create indexes for sensor_logs
    const sensorLogs = db.collection('sensor_logs');
    await sensorLogs.createIndex({ timestamp: -1 });
    await sensorLogs.createIndex({ sensor_type: 1, timestamp: -1 });
    await sensorLogs.createIndex({ device: 1, timestamp: -1 });
    console.log('[DB] ✅ sensor_logs indexes created');

    // Create indexes for control_logs
    const controlLogs = db.collection('control_logs');
    await controlLogs.createIndex({ timestamp: -1 });
    await controlLogs.createIndex({ device: 1, timestamp: -1 });
    console.log('[DB] ✅ control_logs indexes created');

    // Create indexes for predictions
    const predictions = db.collection('predictions');
    await predictions.createIndex({ timestamp: -1 });
    console.log('[DB] ✅ predictions indexes created');

  } catch (error) {
    console.error('[DB] ❌ Index creation error:', error.message);
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  createIndexes,
  DB_NAME
};