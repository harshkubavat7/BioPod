const { getDB } = require('../config/db');
const FanManager = require('./fan-manager');
// const FanManager = require('./fan-manager');
class ChatbotService {
  
  static async processMessage(userMessage) {
    try {
      const normalized = userMessage.toLowerCase().trim();
      
      console.log('[Chatbot] Processing message:', normalized);
      
      // Temperature questions
      if (normalized.includes('temperature') || normalized.includes('temp') || normalized.includes('hot')) {
        return await this.handleTemperatureQuery();
      }
      
      // Humidity questions
      if (normalized.includes('humidity') || normalized.includes('humid') || normalized.includes('moisture')) {
        return await this.handleHumidityQuery();
      }
      
      // Feed questions
      if (normalized.includes('feed') || normalized.includes('food') || normalized.includes('eat')) {
        return await this.handleFeedQuery();
      }
      
      // Harvest questions
      if (normalized.includes('harvest') || normalized.includes('ready') || normalized.includes('sell')) {
        return await this.handleHarvestQuery();
      }
      
      // Fan control - TURN ON
      if (normalized.includes('turn on fan') || normalized.includes('fan on') || (normalized.includes('fan') && normalized.includes('on'))) {
        return await this.handleFanControl('ON');
      }
      
      // Fan control - TURN OFF
      if (normalized.includes('turn off fan') || normalized.includes('fan off') || (normalized.includes('fan') && normalized.includes('off'))) {
        return await this.handleFanControl('OFF');
      }
      
      // Fan status
    if (normalized.includes('fan status') || normalized.includes('is fan')) {
      return await this.handleFanStatus();
    }

      // System status
      if (normalized.includes('status') || normalized.includes('health') || normalized.includes('how are') || normalized.includes('problem')) {
        return await this.handleSystemStatus();
      }
      
      // Alerts
      if (normalized.includes('alert') || normalized.includes('issue') || normalized.includes('warning')) {
        return await this.handleAlertsQuery();
      }
      
      // Help/Guide
      if (normalized.includes('help') || normalized.includes('can you') || normalized.includes('what can')) {
        return this.handleHelp();
      }
      
      // Default response
      return {
        success: true,
        message: `I'm not sure what you're asking. Try asking about:
        - Temperature
        - Humidity
        - Feed
        - Harvest date
        - System status
        - Turn on/off fan
        
Type "help" for more options.`
      };
      
    } catch (error) {
      console.error('[Chatbot] Error processing message:', error);
      return {
        success: false,
        message: '❌ Sorry, I encountered an error. Please try again.'
      };
    }
  }
  
  static async handleTemperatureQuery() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const latest = await collection
        .findOne({ sensor_type: 'bsf_temperature' }, { sort: { timestamp: -1 } });
      
      if (!latest) {
        return { success: false, message: 'No temperature data available' };
      }
      
      return {
        success: true,
        message: `🌡️ TEMPERATURE STATUS:

Current: ${latest.value}°C
Status: Optimal (20-28°C)

Tip: Keep between 20-28°C for best growth.`
      };
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      return { success: false, message: 'Error fetching temperature data' };
    }
  }
  
  static async handleHumidityQuery() {
    try {
      const db = await getDB();
      const collection = db.collection('sensor_logs');
      
      const latest = await collection
        .findOne({ sensor_type: 'bsf_humidity' }, { sort: { timestamp: -1 } });
      
      if (!latest) {
        return { success: false, message: 'No humidity data available' };
      }
      
      let status = 'Good';
      if (latest.value < 40) status = 'Too dry - consider misting';
      if (latest.value > 70) status = 'Too humid - increase ventilation';
      
      return {
        success: true,
        message: `💧 HUMIDITY STATUS:

Current: ${latest.value}%
Status: ${status}

Optimal range: 40-70%`
      };
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      return { success: false, message: 'Error fetching humidity data' };
    }
  }
  
  static async handleFeedQuery() {
    return {
      success: true,
      message: `🥗 FEEDING GUIDE:

Current recommendation: 2.5g per day
Schedule: Once daily at 9:00 AM

BSF larvae eat:
- Fruit waste ✓
- Vegetable scraps ✓
- Food residues ✓

Avoid: Meat, dairy, oils`
    };
  }
  
  static async handleHarvestQuery() {
    return {
      success: true,
      message: `📅 HARVEST PREDICTION:

Current weight: 85g
Growth rate: 0.05g/day
Target: 200g

⏳ Estimated ready: 30 days
📅 Harvest date: ~Jan 27, 2026

You'll get a notification when ready!`
    };
  }
  
  // static async handleFanControl(command) {
  //   try {
  //     console.log('[Chatbot] Attempting fan control:', command);
      
  //     const db = await getDB();
  //     const controlCollection = db.collection('control_logs');
      
  //     // Log the control action
  //     await controlCollection.insertOne({
  //       device: 'BSF_001',
  //       type: 'fan_control',
  //       state: command,
  //       mode: 'MANUAL',
  //       timestamp: new Date(),
  //       requested_by: 'chatbot'
  //     });
      
  //     // Publish MQTT message
  //     const mqtt = require('mqtt');
  //     const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883', {
  //       clientId: `biopod-chatbot-${Math.random().toString(16).slice(2, 8)}`
  //     });
      
  //     await new Promise((resolve, reject) => {
  //       mqttClient.on('connect', () => {
  //         const payload = JSON.stringify({
  //           device: 'BSF_001',
  //           state: command,
  //           mode: 'MANUAL',
  //           timestamp: Date.now()
  //         });
          
  //         console.log('[Chatbot] Publishing MQTT:', payload);
          
  //         mqttClient.publish('biopod/bsf/control/fan', payload, (err) => {
  //           mqttClient.end();
  //           if (err) reject(err);
  //           else resolve();
  //         });
  //       });
        
  //       mqttClient.on('error', (err) => {
  //         mqttClient.end();
  //         reject(err);
  //       });
        
  //       setTimeout(() => {
  //         mqttClient.end();
  //         resolve();
  //       }, 2000);
  //     });
      
  //     return {
  //       success: true,
  //       message: command === 'ON'
  //         ? '✅ Fan is now ON in MANUAL mode.'
  //         : '✅ Fan is now OFF in MANUAL mode.'
  //     };
      
  //   } catch (error) {
  //     console.error('[Chatbot] Error controlling fan:', error);
  //     return {
  //       success: false,
  //       message: '❌ Error turning fan ' + command + '. Please try again or control manually.'
  //     };
  //   }
  // }
  
  

// ... inside ChatbotService class

// static async handleFanControl(command) {
//   try {
//     console.log('[Chatbot] Fan control request:', command);

//     const result = await FanManager.setManualFan(command);

//     return {
//       success: result.success,
//       message: result.message,
//       timeout_minutes: result.timeout_minutes,
//       will_revert_to: result.will_revert_to
//     };

//   } catch (error) {
//     console.error('[Chatbot] Error controlling fan:', error);
//     return {
//       success: false,
//       message: '❌ Error turning fan ' + command + '. Please try again.'
//     };
//   }
// }

static async handleFanControl(command) {
  try {
    console.log('[Chatbot] Fan control request:', command);

    const FanManager = require('./fan-manager');
    const result = await FanManager.setManualFan(command);

    return {
      success: result.success,
      message: result.message,
      timeout_minutes: result.timeout_minutes,
      will_revert_to: result.will_revert_to
    };

  } catch (error) {
    console.error('[Chatbot] Error controlling fan:', error);
    return {
      success: false,
      message: '❌ Error controlling fan. Please try again.'
    };
  }
}


// Add new handler for "fan status"
static async handleFanStatus() {
  try {
    const status = await FanManager.getFanStatus();

    return {
      success: true,
      message: `🎛️ FAN STATUS:

State: ${status.state}
Mode: ${status.mode}
${status.manual_active ? '⏱️ Manual control active (5-minute timeout)' : '⚙️ Automatic control enabled'}

${status.message}`
    };
  } catch (error) {
    console.error('[Chatbot] Error getting fan status:', error);
    return { success: false, message: 'Error getting fan status' };
  }
}


  static async handleSystemStatus() {
    try {
      const db = await getDB();
      
      const tempData = await db.collection('sensor_logs').findOne({ sensor_type: 'bsf_temperature' }, { sort: { timestamp: -1 } });
      const humidData = await db.collection('sensor_logs').findOne({ sensor_type: 'bsf_humidity' }, { sort: { timestamp: -1 } });
      const alerts = await db.collection('alerts').countDocuments({ read: false });
      
      return {
        success: true,
        message: `📊 SYSTEM STATUS:

🌡️ Temperature: ${tempData?.value || 'N/A'}°C (Optimal)
💧 Humidity: ${humidData?.value || 'N/A'}% (Good)
🔔 Unread Alerts: ${alerts}
⚙️ Auto-control: Enabled
✅ Overall Health: Good`
      };
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      return { success: false, message: 'Error fetching system status' };
    }
  }
  
  static async handleAlertsQuery() {
    try {
      const db = await getDB();
      const recentAlerts = await db.collection('alerts')
        .find()
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();
      
      if (recentAlerts.length === 0) {
        return { success: true, message: '✅ No recent alerts. System is running smoothly!' };
      }
      
      let message = '🚨 RECENT ALERTS:\n\n';
      recentAlerts.forEach((alert, i) => {
        message += `${i + 1}. ${alert.message}\n`;
      });
      
      return { success: true, message };
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      return { success: false, message: 'Error fetching alerts' };
    }
  }
  
  static handleHelp() {
    return {
      success: true,
      message: `📚 CHATBOT HELP:

I can answer these questions:

1️⃣ Temperature - "What's the temperature?"
2️⃣ Humidity - "How's the humidity?"
3️⃣ Feed - "Should I feed?"
4️⃣ Harvest - "When can I harvest?"
5️⃣ Alerts - "Show alerts"
6️⃣ Fan - "Turn on/off fan"
7️⃣ Status - "System status?"
8️⃣ Help - "Help?"

Try any of these and I'll give you smart insights! 🤖`
    };
  }
}

module.exports = ChatbotService;
