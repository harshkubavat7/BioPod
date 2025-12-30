const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// ✅ CORRECTED IMPORTS
const { connectDB, createIndexes, closeDB } = require('./src/config/db');
const { connectMQTT } = require('./src/config/mqtt');
const {
  initializeCollections,
  initializeBsfHandlers,
  initMQTTHandlers
} = require('./src/handlers/mqtt.handler');
const sensorRoutes = require('./src/routes/sensors');
const bsfRoutes = require('./src/routes/bsf.routes');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const mongoUri = process.env.MONGO_URI;

// Initialize Express app
const app = express();

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Add this BEFORE your routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const AutoPredictorService = require('./src/services/auto-predictor');
const AlertService = require('./src/services/alert-service');

const chatbotRoutes = require('./src/routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);

// Add these routes BEFORE the error handling middleware
const alertRoutes = require('./src/routes/alerts');
// const chatbotRoutes = require('./src/routes/chatbot');

app.use('/api/alerts', alertRoutes);
// app.use('/api/chatbot', chatbotRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const dashboardRoutes = require('./src/routes/dashboard-routes');
app.use('/api/dashboard', dashboardRoutes);




// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'BioPod Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    port: PORT
  });
});

app.get('/health/db', async (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      message: 'Database endpoint ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  socket.emit('welcome', {
    message: 'Connected to BioPod Backend',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVER START FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: DATABASE CONNECTION
    // ─────────────────────────────────────────────────────────────────────

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔌 DATABASE CONNECTION CHECK');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔌 Attempting MongoDB connection...');
    console.log(`📍 MONGO_URI: ${process.env.MONGO_URI ? '✅ SET' : '❌ NOT SET'}`);

    const db = await connectDB(mongoUri);

    console.log('✅ MongoDB connected successfully!');
    console.log('📚 Database: biopod_database');
    console.log('═══════════════════════════════════════════════════════════');

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: CREATE INDEXES
    // ─────────────────────────────────────────────────────────────────────

    console.log('');
    await createIndexes(db);

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: MQTT CONNECTION & INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔌 MQTT CONNECTION CHECK');
    console.log('═══════════════════════════════════════════════════════════');

    let mqttClient;

    if (process.env.ENABLE_MQTT !== 'false') {
      try {
        mqttClient = await connectMQTT();
        
        console.log('[MQTT BSF] Initializing handlers...');
        
        await initializeCollections();
        initializeBsfHandlers(mqttClient);
        initMQTTHandlers();
        
      } catch (error) {
        console.error('[MQTT] ❌ MQTT Connection Failed:', error.message);
        console.warn('⚠️  Continuing without MQTT...');
      }
    }

    console.log('═══════════════════════════════════════════════════════════');

    // After database is connected:
    AutoPredictorService.startAutoPredictor();
    AlertService.initializeEmail();

console.log('[Server] ✅ Auto-prediction scheduler started');

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4: MOUNT API ROUTES
    // ─────────────────────────────────────────────────────────────────────

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🛣️  MOUNTING API ROUTES');
    console.log('═══════════════════════════════════════════════════════════');

    app.use('/api/sensors', sensorRoutes);
    console.log('[Routes] ✅ Sensor routes: /api/sensors');

    app.use('/api/bsf', bsfRoutes);
    console.log('[Routes] ✅ BSF routes: /api/bsf');

    console.log('═══════════════════════════════════════════════════════════');

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5: ERROR HANDLERS
    // ─────────────────────────────────────────────────────────────────────

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(`[ERROR] ${err.message}`);

      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
        ...(NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 6: START LISTENING
    // ─────────────────────────────────────────────────────────────────────

    server.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🚀 BIOPOD BACKEND SERVER STARTED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🔧 Environment: ${NODE_ENV}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('');
      console.log('📌 Health Checks:');
      console.log(`   - http://localhost:${PORT}/health`);
      console.log(`   - http://localhost:${PORT}/health/db`);
      console.log('');
      console.log('📡 API Endpoints:');
      console.log(`   - http://localhost:${PORT}/api/sensors`);
      console.log(`   - http://localhost:${PORT}/api/bsf`);
      console.log('');
      console.log('🌐 WebSocket:');
      console.log(`   - ws://localhost:${PORT}`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
    });

  } catch (error) {
    console.error('[SERVER ERROR]', error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════

async function gracefulShutdown() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🛑 GRACEFUL SHUTDOWN STARTING...');
  console.log('═══════════════════════════════════════════════════════════');

  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log('[Server] ✅ HTTP server closed');
    });
  }

  // Close Database
  try {
    await closeDB();
    console.log('[Database] ✅ Database connection closed');
  } catch (error) {
    console.error('[Database] Error closing connection:', error.message);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SHUTDOWN COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNAL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received (Ctrl+C)');
  gracefulShutdown();
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

startServer();

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  app,
  server,
  io,
  startServer,
  gracefulShutdown
};
