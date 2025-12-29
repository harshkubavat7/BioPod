const cron = require('node-cron');
const db = require('../config/db');
const Predictor = require('../ml/predictor');
const alertService = require('./alert-service');
const { getDB } = require('../config/db');
const FanManager = require('./fan-manager');


class AutoPredictorService {
  
  // Start auto-predictions (run this once at server startup)
  static startAutoPredictor() {
    console.log('[AutoPredictor] Starting automatic prediction scheduler');
    
    // Run predictions every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[AutoPredictor] Running automatic prediction...');
      await this.runPredictions();
    });
    
    // Also run every 10 minutes for anomaly detection
    cron.schedule('*/10 * * * *', async () => {
      console.log('[AutoPredictor] Checking for anomalies...');
      await this.checkAnomalies();
    });
  }
  
  // Main prediction function
  static async runPredictions() {
    try {
      // Predict Temperature
      const tempPrediction = await Predictor.predictNextTemperature();
      
      // Predict Humidity
      const humidityPrediction = await Predictor.predictNextHumidity();
      
      // Predict Air Quality
      const airQualityPrediction = await Predictor.predictNextAirQuality();
      
      // Get harvest prediction
      const harvestPrediction = await Predictor.getGrowthPrediction();
      
      // Get feed recommendation
      const feedRec = await Predictor.recommendFeed();
      
      // Save to database
      await this.savePredictions({
        temperature: tempPrediction,
        humidity: humidityPrediction,
        air_quality: airQualityPrediction,
        harvest: harvestPrediction,
        feed: feedRec,
        timestamp: new Date()
      });
      
      // Check thresholds and send alerts
      await this.checkAndAlert(tempPrediction, humidityPrediction);
      
      console.log('[AutoPredictor] ✅ Predictions completed');
      
    } catch (error) {
      console.error('[AutoPredictor] ❌ Error running predictions:', error.message);
    }
  }
  
  // Check anomalies every 10 minutes
  static async checkAnomalies() {
    try {
      const anomalies = await Predictor.detectAnomalies();
      
      if (anomalies.length > 0) {
        console.log('[AutoPredictor] 🚨 Anomalies detected:', anomalies.length);
        
        // Send alert
        await alertService.sendAlert({
          type: 'ANOMALY',
          severity: 'HIGH',
          message: `${anomalies.length} anomalies detected in sensor data!`,
          data: anomalies
        });
      }
      
    } catch (error) {
      console.error('[AutoPredictor] Error checking anomalies:', error.message);
    }
  }
  
  // Check thresholds and send alerts
  // static async checkAndAlert(tempPrediction, humidityPrediction) {
    
  //   const alerts = [];
    
  //   // Temperature Alert
  //   if (tempPrediction.predicted_temp_1h > 28) {
  //     alerts.push({
  //       type: 'TEMPERATURE',
  //       severity: 'HIGH',
  //       message: `⚠️  ALERT: Temperature will reach ${tempPrediction.predicted_temp_1h}°C in 1 hour. Turn on fan NOW!`,
  //       action: 'TURN_ON_FAN',
  //       data: tempPrediction
  //     });
  //   }
    
  //   if (tempPrediction.predicted_temp_1h < 20) {
  //     alerts.push({
  //       type: 'TEMPERATURE',
  //       severity: 'MEDIUM',
  //       message: `⚠️  WARNING: Temperature dropping to ${tempPrediction.predicted_temp_1h}°C. Check heater.`,
  //       action: 'CHECK_HEATER',
  //       data: tempPrediction
  //     });
  //   }
    
  //   // Humidity Alert
  //   if (humidityPrediction.predicted_humidity_1h < 45) {
  //     alerts.push({
  //       type: 'HUMIDITY',
  //       severity: 'MEDIUM',
  //       message: `💧 WARNING: Humidity will drop to ${humidityPrediction.predicted_humidity_1h}%. Consider misting.`,
  //       action: 'SPRAY_WATER',
  //       data: humidityPrediction
  //     });
  //   }
    
  //   if (humidityPrediction.predicted_humidity_1h > 75) {
  //     alerts.push({
  //       type: 'HUMIDITY',
  //       severity: 'MEDIUM',
  //       message: `💧 WARNING: Humidity too high (${humidityPrediction.predicted_humidity_1h}%). Increase ventilation.`,
  //       action: 'INCREASE_FAN',
  //       data: humidityPrediction
  //     });
  //   }
    
  //   // Send all alerts
  //   for (const alert of alerts) {
  //     await alertService.sendAlert(alert);
  //   }
    
  //   // Save alerts to database
  //   if (alerts.length > 0) {
  //     await this.saveAlerts(alerts);
  //   }
  // }

  static async checkAndAlert(tempPrediction, humidityPrediction) {
  const alerts = [];
  const FanManager = require('./fan-manager');
  
  // Temperature Alert - AUTO TURN ON FAN
  if (tempPrediction.predicted_temp_1h > 28) {
    // Automatically turn on fan
    await FanManager.setManualFan('ON');
    
    alerts.push({
      type: 'TEMPERATURE',
      severity: 'HIGH',
      message: `⚠️  ALERT: Temperature will reach ${tempPrediction.predicted_temp_1h}°C in 1 hour. Fan turned ON!`,
      action: 'FAN_ON',
      data: tempPrediction
    });
  }
  
  // Temperature Alert - AUTO TURN OFF FAN
  if (tempPrediction.predicted_temp_1h < 25) {
    // Automatically turn off fan
    await FanManager.setManualFan('OFF');
    
    alerts.push({
      type: 'TEMPERATURE',
      severity: 'MEDIUM',
      message: `✅ Temperature normalized to ${tempPrediction.predicted_temp_1h}°C. Fan turned OFF.`,
      action: 'FAN_OFF',
      data: tempPrediction
    });
  }
  
  if (tempPrediction.predicted_temp_1h < 20) {
    alerts.push({
      type: 'TEMPERATURE',
      severity: 'MEDIUM',
      message: `⚠️  WARNING: Temperature dropping to ${tempPrediction.predicted_temp_1h}°C. Check heater.`,
      action: 'CHECK_HEATER',
      data: tempPrediction
    });
  }
  
  // Humidity Alert
  if (humidityPrediction.predicted_humidity_1h < 45) {
    alerts.push({
      type: 'HUMIDITY',
      severity: 'MEDIUM',
      message: `💧 WARNING: Humidity will drop to ${humidityPrediction.predicted_humidity_1h}%. Consider misting.`,
      action: 'SPRAY_WATER',
      data: humidityPrediction
    });
  }
  
  if (humidityPrediction.predicted_humidity_1h > 75) {
    alerts.push({
      type: 'HUMIDITY',
      severity: 'MEDIUM',
      message: `💧 WARNING: Humidity too high (${humidityPrediction.predicted_humidity_1h}%). Increase ventilation.`,
      action: 'INCREASE_FAN',
      data: humidityPrediction
    });
  }
  
  // Send all alerts
  for (const alert of alerts) {
    await alertService.sendAlert(alert);
  }
  
  // Save alerts to database
  if (alerts.length > 0) {
    await this.saveAlerts(alerts);
  }
}
  
  // Save predictions to database
  // static async savePredictions(predictions) {
  //   const collection = db.db.collection('predictions');
    
  //   await collection.insertOne({
  //     ...predictions,
  //     created_at: new Date()
  //   });
  // }
  
static async savePredictions(predictions) {
  try {
    const { getDB } = require('../config/db');
    const database = await getDB();
    const collection = database.collection('predictions');
    
    await collection.insertOne({
      ...predictions,
      created_at: new Date()
    });
    
    console.log('[AutoPredictor] ✅ Predictions saved to database');
  } catch (error) {
    console.error('[AutoPredictor] Error saving predictions:', error.message);
  }
}

  // Save alerts to database
  // static async saveAlerts(alerts) {
  //   const collection = db.db.collection('alerts');
    
  //   for (const alert of alerts) {
  //     await collection.insertOne({
  //       ...alert,
  //       read: false,
  //       created_at: new Date()
  //     });
  //   }
  // }


  // Save alerts to database
static async saveAlerts(alerts) {
  try {
    const { getDB } = require('../config/db');
    const database = await getDB();
    const collection = database.collection('alerts');
    
    for (const alert of alerts) {
      await collection.insertOne({
        ...alert,
        read: false,
        created_at: new Date()
      });
    }
    
    console.log('[AutoPredictor] ✅ Alerts saved to database:', alerts.length);
  } catch (error) {
    console.error('[AutoPredictor] Error saving alerts:', error.message);
  }
}
}

module.exports = AutoPredictorService;