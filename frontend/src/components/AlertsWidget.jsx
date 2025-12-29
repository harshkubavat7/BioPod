import React, { useState, useEffect } from 'react';
import '../styles/AlertsWidget.css';

const AlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadAlerts();
    const interval = setInterval(fetchUnreadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/alerts/unread');
      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts || []);
        setUnreadCount(data.count || 0);

        data.alerts?.forEach(alert => {
          if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
            showDesktopNotification(alert);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a._id !== alertId));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const showDesktopNotification = (alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 BIOPOD ALERT', {
        body: alert.message,
        icon: '/logo.png',
        tag: alert._id
      });
    }
  };

  const getSeverityClass = (severity) => {
    return `alert-${severity.toLowerCase()}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="alerts-widget">
      <button 
        className="alert-bell"
        onClick={() => setShowPanel(!showPanel)}
        title="View alerts"
      >
        🔔
        {unreadCount > 0 && (
          <span className="alert-badge">{unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <div className="alert-panel">
          <div className="alert-panel-header">
            <h3>Alerts</h3>
            <button 
              className="close-btn"
              onClick={() => setShowPanel(false)}
            >
              ✕
            </button>
          </div>

          <div className="alert-list">
            {loading && <p className="loading">Loading alerts...</p>}

            {!loading && alerts.length === 0 && (
              <div className="no-alerts">
                <p>✅ No alerts</p>
                <p>All systems normal</p>
              </div>
            )}

            {!loading && alerts.length > 0 && alerts.map(alert => (
              <div 
                key={alert._id}
                className={`alert-item ${getSeverityClass(alert.severity)}`}
              >
                <div className="alert-header">
                  <span className="severity-badge">{alert.severity}</span>
                  <span className="alert-type">
                    {alert.type.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="alert-message">
                  {alert.message}
                </div>

                {alert.action && (
                  <div className="alert-action">
                    <strong>Action:</strong> {alert.action}
                  </div>
                )}

                {alert.recommendation && (
                  <div className="alert-recommendation">
                    <strong>Recommendation:</strong> {alert.recommendation}
                  </div>
                )}

                <div className="alert-footer">
                  <span className="alert-time">
                    {formatTime(alert.createdAt)}
                  </span>
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(alert._id)}
                  >
                    Mark as read
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsWidget;
