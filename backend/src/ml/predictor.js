const { getDB } = require('../config/db');

class Predictor {
  
  // ==================== TEMPERATURE PREDICTIONS ====================
  
  static async predictNextTemperature() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const data = await collection
        .find({
          sensor_type: 'bsf_temperature',
          timestamp: { $gte: twentyFourHoursAgo }
        })
        .sort({ timestamp: 1 })
        .toArray();
      
      if (data.length < 5) {
        return { error: 'Not enough data', confidence: 0 };
      }
      
      const values = data.map(d => d.value);
      const current_temp = values[values.length - 1];
      
      const predicted_temp_1h = this.linearRegression(values, 1);
      const trend = predicted_temp_1h > current_temp ? 'RISING' : 'FALLING';
      
      return {
        current_temp: parseFloat(current_temp.toFixed(1)),
        predicted_temp_1h: parseFloat(predicted_temp_1h.toFixed(1)),
        trend,
        confidence: 0.85,
        data_points: values.length
      };
      
    } catch (error) {
      console.error('[Predictor] Error predicting temperature:', error);
      return { error: error.message };
    }
  }
  
  // ==================== HUMIDITY PREDICTIONS ====================
  
  static async predictNextHumidity() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const data = await collection
        .find({
          sensor_type: 'bsf_humidity',
          timestamp: { $gte: twentyFourHoursAgo }
        })
        .sort({ timestamp: 1 })
        .toArray();
      
      if (data.length < 5) {
        return { error: 'Not enough data', confidence: 0 };
      }
      
      const values = data.map(d => d.value);
      const current_humidity = values[values.length - 1];
      
      const predicted_humidity_1h = this.linearRegression(values, 1);
      const trend = predicted_humidity_1h > current_humidity ? 'RISING' : 'FALLING';
      
      return {
        current_humidity: parseFloat(current_humidity.toFixed(1)),
        predicted_humidity_1h: parseFloat(predicted_humidity_1h.toFixed(1)),
        trend,
        confidence: 0.85,
        data_points: values.length
      };
      
    } catch (error) {
      console.error('[Predictor] Error predicting humidity:', error);
      return { error: error.message };
    }
  }
  
  // ==================== AIR QUALITY PREDICTIONS ====================
  
  static async predictNextAirQuality() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const data = await collection
        .find({
          sensor_type: 'bsf_air_quality',
          timestamp: { $gte: twentyFourHoursAgo }
        })
        .sort({ timestamp: 1 })
        .toArray();
      
      if (data.length < 5) {
        return { error: 'Not enough data', confidence: 0 };
      }
      
      const values = data.map(d => d.value);
      const current_air_quality = values[values.length - 1];
      
      const predicted_air_quality_1h = this.linearRegression(values, 1);
      const status = predicted_air_quality_1h < 1000 ? 'GOOD' : predicted_air_quality_1h < 1500 ? 'MODERATE' : 'POOR';
      
      return {
        current_air_quality: parseFloat(current_air_quality.toFixed(0)),
        predicted_air_quality_1h: parseFloat(predicted_air_quality_1h.toFixed(0)),
        status,
        confidence: 0.80,
        data_points: values.length
      };
      
    } catch (error) {
      console.error('[Predictor] Error predicting air quality:', error);
      return { error: error.message };
    }
  }
  
  // ==================== GROWTH & HARVEST PREDICTIONS ====================
  
  static async getGrowthPrediction() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const data = await collection
        .find({
          sensor_type: 'bsf_weight',
          timestamp: { $gte: thirtyDaysAgo }
        })
        .sort({ timestamp: 1 })
        .toArray();
      
      if (data.length < 3) {
        return {
          current_weight: 0,
          avg_growth_per_day: 0.05,
          days_to_harvest: 999,
          projected_harvest_weight: 0,
          confidence: 0
        };
      }
      
      const values = data.map(d => d.value);
      const current_weight = values[values.length - 1];
      
      const firstWeight = values[0];
      const timeSpanDays = data.length / 24;
      const avg_growth_per_day = (current_weight - firstWeight) / Math.max(timeSpanDays, 1);
      
      const target_weight = 200;
      const days_to_harvest = Math.ceil((target_weight - current_weight) / Math.max(avg_growth_per_day, 0.01));
      
      return {
        current_weight: parseFloat(current_weight.toFixed(1)),
        avg_growth_per_day: parseFloat(avg_growth_per_day.toFixed(3)),
        days_to_harvest: Math.max(days_to_harvest, 1),
        projected_harvest_weight: parseFloat((current_weight + (avg_growth_per_day * days_to_harvest)).toFixed(1)),
        confidence: 0.75
      };
      
    } catch (error) {
      console.error('[Predictor] Error predicting growth:', error);
      return {
        current_weight: 0,
        avg_growth_per_day: 0.05,
        days_to_harvest: 999,
        projected_harvest_weight: 0
      };
    }
  }
  
  // ==================== FEED RECOMMENDATIONS ====================
  
  static async recommendFeed() {
    try {
      const growthPred = await this.getGrowthPrediction();
      
      const feedAmount = growthPred.current_weight * 0.01;
      
      let reason = 'Normal growth';
      if (growthPred.avg_growth_per_day < 0.03) {
        reason = 'Growth slower than expected - increase feed';
      } else if (growthPred.avg_growth_per_day > 0.1) {
        reason = 'Growth excellent - maintain current feed';
      }
      
      return {
        recommended_amount: parseFloat(feedAmount.toFixed(2)),
        growth_rate: parseFloat(growthPred.avg_growth_per_day.toFixed(3)),
        reason,
        schedule: 'Once daily at 9:00 AM'
      };
      
    } catch (error) {
      console.error('[Predictor] Error recommending feed:', error);
      return {
        recommended_amount: 2.5,
        growth_rate: 0.05,
        reason: 'Default recommendation',
        schedule: 'Once daily at 9:00 AM'
      };
    }
  }
  
  // ==================== ANOMALY DETECTION ====================
  
  static async detectAnomalies() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const data = await collection
        .find({
          timestamp: { $gte: oneHourAgo }
        })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      
      const anomalies = [];
      
      data.forEach(reading => {
        if (reading.sensor_type === 'bsf_temperature') {
          if (reading.value > 35 || reading.value < 10) {
            anomalies.push({
              type: 'TEMPERATURE',
              value: reading.value,
              expected_range: '15-30°C'
            });
          }
        }
        
        if (reading.sensor_type === 'bsf_humidity') {
          if (reading.value > 90 || reading.value < 20) {
            anomalies.push({
              type: 'HUMIDITY',
              value: reading.value,
              expected_range: '40-70%'
            });
          }
        }
      });
      
      return anomalies;
      
    } catch (error) {
      console.error('[Predictor] Error detecting anomalies:', error);
      return [];
    }
  }
  
  // ==================== LINEAR REGRESSION HELPER ====================
  
  static linearRegression(values, hoursAhead = 1) {
    if (values.length < 2) return values[values.length - 1];
    
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictedValue = intercept + slope * (n + hoursAhead - 1);
    
    return predictedValue;
  }
}

module.exports = Predictor;
