const { getDB } = require('../config/db');
const { getMqttClient } = require('../config/mqtt');

class FanManager {
  static manualFanTimers = {}; // Track active manual timers

  /**
   * Manual fan control with 5-minute timeout
   */
  static async setManualFan(state) {
    try {
      const device = 'BSF_001';
      
      console.log(`[FanManager] 🎛️  Manual fan control: ${state}`);

      // Clear any existing manual timer
      if (this.manualFanTimers[device]) {
        clearTimeout(this.manualFanTimers[device]);
        console.log(`[FanManager] ⏱️  Cleared previous timer`);
      }

      // Save to database
      const db = await getDB();
      await db.collection('control_logs').insertOne({
        device,
        type: 'fan_control',
        state: state,
        mode: 'MANUAL',
        timestamp: new Date(),
        source: 'chatbot',
        duration_minutes: 5,
        saved_at: new Date()
      });

      // Publish MQTT command to device
    //   const mqttClient = getMqttClient();
    //   if (mqttClient && mqttClient.connected) {
    //     const payload = JSON.stringify({
    //       device,
    //       state,
    //       mode: 'MANUAL',
    //       timestamp: Date.now()
    //     });

    //     mqttClient.publish('biopod/bsf/control/fan', payload);
    //     console.log(`[FanManager] ✅ Published MQTT: ${state}`);
    //   }

      // Publish MQTT command to device
const mqttClient = getMqttClient();
if (mqttClient && mqttClient.connected) {
  const payload = JSON.stringify({
    device,
    state: state,      // Arduino reads this as "command" fallback
    mode: 'MANUAL',    // This activates MANUAL mode
    timestamp: Date.now()
  });

  mqttClient.publish('biopod/bsf/control/fan', payload);
  console.log(`[FanManager] ✅ Published MQTT: ${state}`);
}


      // Set 5-minute timeout to revert to AUTO mode
      this.manualFanTimers[device] = setTimeout(async () => {
        console.log(`[FanManager] ⏱️  5-minute timer expired, reverting to AUTO mode`);
        await this.revertToAutoMode(device);
      }, 5 * 60 * 1000); // 5 minutes

      return {
        success: true,
        message: `✅ Fan set to ${state} for 5 minutes in MANUAL mode`,
        timeout_minutes: 5,
        will_revert_to: 'AUTO'
      };

    } catch (error) {
      console.error('[FanManager] Error setting manual fan:', error);
      return {
        success: false,
        message: '❌ Error controlling fan',
        error: error.message
      };
    }
  }

  /**
   * Revert to AUTO mode (automatic control)
   */
  static async revertToAutoMode(device = 'BSF_001') {
    try {
      console.log(`[FanManager] 🔄 Reverting ${device} to AUTO mode`);

      // Clear timer
      if (this.manualFanTimers[device]) {
        clearTimeout(this.manualFanTimers[device]);
        delete this.manualFanTimers[device];
      }

      // Save to database
      const db = await getDB();
      await db.collection('control_logs').insertOne({
        device,
        type: 'fan_control',
        state: 'AUTO',
        mode: 'AUTO',
        timestamp: new Date(),
        source: 'system_auto_revert',
        reason: 'Manual control timeout (5 minutes)',
        saved_at: new Date()
      });

      // Publish MQTT to revert to AUTO
      const mqttClient = getMqttClient();
      if (mqttClient && mqttClient.connected) {
        const payload = JSON.stringify({
          device,
          state: 'AUTO',
          mode: 'AUTO',
          timestamp: Date.now()
        });

        mqttClient.publish('biopod/bsf/control/fan', payload);
        console.log(`[FanManager] ✅ Reverted to AUTO mode via MQTT`);
      }

      return { success: true, message: 'Reverted to AUTO mode' };

    } catch (error) {
      console.error('[FanManager] Error reverting to AUTO:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current fan status
   */
  static async getFanStatus() {
    try {
      const db = await getDB();
      const latest = await db.collection('control_logs')
        .findOne({ type: 'fan_control' }, { sort: { timestamp: -1 } });

      if (!latest) {
        return {
          state: 'UNKNOWN',
          mode: 'AUTO',
          message: 'No fan data available'
        };
      }

      const device = 'BSF_001';
      const hasActiveTimer = !!this.manualFanTimers[device];

      return {
        state: latest.state,
        mode: latest.mode,
        timestamp: latest.timestamp,
        manual_active: hasActiveTimer,
        message: hasActiveTimer 
          ? '🎛️ Manual control active (will revert to AUTO in ~5 minutes)'
          : '⚙️ Automatic control active'
      };
    } catch (error) {
      console.error('[FanManager] Error getting fan status:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FanManager;
