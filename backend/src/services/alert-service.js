const { getDB } = require('../config/db');
const nodemailer = require('nodemailer');

class AlertService {
  
  static initializeEmail() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  static async sendAlert(alert) {
    console.log(`[AlertService] 📢 Sending alert: ${alert.type}`);
    
    try {
      await this.saveToDatabase(alert);
      
      if (alert.severity === 'HIGH') {
        await this.sendEmail(alert);
      }
      
      await this.sendPushNotification(alert);
      console.log(`[AlertService] ✅ Alert sent: ${alert.message}`);
    } catch (error) {
      console.error('[AlertService] Error sending alert:', error);
    }
  }
  
  static async saveToDatabase(alert) {
    try {
      const db = await getDB();
      const collection = db.collection('alerts');
      
      await collection.insertOne({
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        action: alert.action,
        data: alert.data,
        read: false,
        created_at: new Date()
      });
    } catch (error) {
      console.error('[AlertService] Error saving to database:', error);
    }
  }
  
  static async sendEmail(alert) {
    try {
      if (!process.env.EMAIL_USER) {
        console.log('[AlertService] Email not configured, skipping');
        return;
      }
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ALERT_EMAIL,
        subject: `🚨 BIOPOD ALERT: ${alert.type}`,
        html: `
          <h2>Alert: ${alert.type}</h2>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${new Date()}</p>
          <p><strong>Suggested Action:</strong> ${alert.action}</p>
        `
      };
      
      await this.transporter.sendMail(mailOptions);
      console.log('[AlertService] ✅ Email sent');
    } catch (error) {
      console.error('[AlertService] ❌ Email error:', error.message);
    }
  }
  
  static async sendPushNotification(alert) {
    console.log('[AlertService] Push notification would be sent here');
  }
  
  static async getUnreadAlerts() {
    try {
      const db = await getDB();
      const collection = db.collection('alerts');
      
      return await collection
        .find({ read: false })
        .sort({ created_at: -1 })
        .toArray();
    } catch (error) {
      console.error('[AlertService] Error getting unread alerts:', error);
      return [];
    }
  }
  
  static async markAsRead(alertId) {
    try {
      const db = await getDB();
      const collection = db.collection('alerts');
      const { ObjectId } = require('mongodb');
      
      await collection.updateOne(
        { _id: new ObjectId(alertId) },
        { $set: { read: true } }
      );
    } catch (error) {
      console.error('[AlertService] Error marking alert as read:', error);
    }
  }
}

module.exports = AlertService;
