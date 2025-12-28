const mongoose = require('mongoose');

// ═════════════════════════════════════════════════════════════════════════════
// BSF SENSOR LOGS SCHEMA - Stores all sensor readings
// ═════════════════════════════════════════════════════════════════════════════

const bsfSensorLogSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    default: 'BSF_001',
    index: true
  },
  
  sensor_type: {
    type: String,
    enum: ['temperature', 'humidity', 'air_quality', 'fan_status'],
    required: true,
    index: true
  },
  
  value: {
    type: Number,
    required: true
  },
  
  unit: {
    type: String,
    required: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  received_at: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
bsfSensorLogSchema.index({ device_id: 1, timestamp: -1 });
bsfSensorLogSchema.index({ sensor_type: 1, timestamp: -1 });

// TTL Index - Auto-delete old data after 90 days
bsfSensorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const BsfSensorLog = mongoose.model('BsfSensorLog', bsfSensorLogSchema);


// ═════════════════════════════════════════════════════════════════════════════
// BSF CURRENT DATA SCHEMA - Latest readings (for dashboard)
// ═════════════════════════════════════════════════════════════════════════════

const bsfCurrentDataSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    default: 'BSF_001'
  },
  
  temperature: {
    value: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: '°C'
    },
    timestamp: Date
  },
  
  humidity: {
    value: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: '%'
    },
    timestamp: Date
  },
  
  air_quality: {
    value: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: 'ppm'
    },
    timestamp: Date
  },
  
  fan_status: {
    state: {
      type: String,
      enum: ['ON', 'OFF', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    mode: {
      type: String,
      enum: ['AUTO', 'MANUAL', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    timestamp: Date
  },
  
  last_update: {
    type: Date,
    default: Date.now
  }
});

const BsfCurrentData = mongoose.model('BsfCurrentData', bsfCurrentDataSchema);


// ═════════════════════════════════════════════════════════════════════════════
// BSF CONFIGURATION SCHEMA - Settings & thresholds
// ═════════════════════════════════════════════════════════════════════════════

const bsfConfigSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    default: 'BSF_001'
  },
  
  thresholds: {
    mq_high: {
      type: Number,
      default: 1800,
      description: 'MQ135 threshold to turn fan ON'
    },
    mq_low: {
      type: Number,
      default: 1600,
      description: 'MQ135 threshold to turn fan OFF'
    }
  },
  
  manual_mode_timeout: {
    type: Number,
    default: 300000,
    description: 'Milliseconds before returning to AUTO (5 min)'
  },
  
  location: {
    type: String,
    default: 'Lab_Rack_1'
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const BsfConfig = mongoose.model('BsfConfig', bsfConfigSchema);


// ═════════════════════════════════════════════════════════════════════════════
// BSF EVENTS SCHEMA - Manual controls & changes
// ═════════════════════════════════════════════════════════════════════════════

const bsfEventSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true
  },
  
  event_type: {
    type: String,
    enum: ['manual_on', 'manual_off', 'auto_mode', 'threshold_change', 'system_event'],
    required: true
  },
  
  details: {
    command: String,
    previous_value: mongoose.Schema.Types.Mixed,
    new_value: mongoose.Schema.Types.Mixed,
    reason: String
  },
  
  triggered_by: {
    type: String,
    enum: ['api', 'mqtt', 'auto', 'system'],
    default: 'mqtt'
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// TTL Index - Auto-delete old events after 30 days
bsfEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

const BsfEvent = mongoose.model('BsfEvent', bsfEventSchema);


// ═════════════════════════════════════════════════════════════════════════════
// EXPORT ALL MODELS
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  BsfSensorLog,
  BsfCurrentData,
  BsfConfig,
  BsfEvent
};


/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DATABASE COLLECTIONS REFERENCE
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Collection: BsfSensorLog
 *   Purpose: Stores all individual sensor readings
 *   Documents per day: ~1440 (one per minute)
 *   Auto-delete: After 90 days (TTL)
 *   Indexes: device_id + timestamp, sensor_type + timestamp
 * 
 * Collection: BsfCurrentData
 *   Purpose: Latest reading from each sensor (for dashboard)
 *   Documents: 1 per device
 *   Updated: Every 30 seconds
 *   No TTL (always keep latest)
 * 
 * Collection: BsfConfig
 *   Purpose: Device settings and thresholds
 *   Documents: 1 per device
 *   Updated: When settings change
 *   No TTL (permanent)
 * 
 * Collection: BsfEvent
 *   Purpose: Log of control commands and changes
 *   Documents: Variable (one per action)
 *   Auto-delete: After 30 days (TTL)
 * 
 * ═════════════════════════════════════════════════════════════════════════════
 */