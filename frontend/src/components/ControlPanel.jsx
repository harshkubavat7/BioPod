import React, { useState, useEffect } from 'react';

export default function ControlPanel() {
  const [fanStatus, setFanStatus] = useState('off');
  const [temperature, setTemperature] = useState(26.5);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dashboard/graphs');
      const json = await res.json();
      if (json.sensorData && json.sensorData.length > 0) {
        const lastTemp = json.sensorData.find(d => d.sensor_type === 'bsf_temperature');
        if (lastTemp) setTemperature(lastTemp.value);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleFanToggle = async () => {
    setLoading(true);
    try {
      // Simulate API call to control fan
      const newStatus = fanStatus === 'off' ? 'on' : 'off';
      
      // In production, this would call: /api/bsf/control/fan
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate delay

      setFanStatus(newStatus);
      setResponse(`✅ Fan turned ${newStatus.toUpperCase()}`);
      
      setTimeout(() => setResponse(''), 3000);
    } catch (error) {
      setResponse(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoControl = async () => {
    setLoading(true);
    try {
      // Auto-control: turn on fan if temp > 27
      if (temperature > 27) {
        setFanStatus('on');
        setResponse('🤖 Auto-control: Temperature high, fan activated');
      } else {
        setFanStatus('off');
        setResponse('🤖 Auto-control: Temperature optimal, fan off');
      }
      setTimeout(() => setResponse(''), 4000);
    } catch (error) {
      setResponse(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-64 p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">⚙️ Control Panel</h1>
      <p className="text-gray-600 mb-8">Manage farm devices manually or with AI auto-control</p>

      {/* Current Status Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg shadow-lg mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm opacity-80">Current Temperature</p>
            <p className="text-4xl font-bold">{temperature}°C</p>
            <p className="text-xs opacity-70 mt-2">Last reading 2 minutes ago</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Fan Status</p>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-4 h-4 rounded-full ${fanStatus === 'on' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <p className="text-2xl font-bold uppercase">{fanStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Control */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-xl font-bold mb-4">🎮 Manual Control</h2>
        <div className="space-y-4">
          <p className="text-gray-700">Fan Control</p>
          <div className="flex gap-4">
            <button
              onClick={handleFanToggle}
              disabled={loading}
              className={`
                flex-1 py-3 rounded-lg font-bold text-white transition-all
                ${fanStatus === 'on'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {loading ? '⏳ Processing...' : `Turn ${fanStatus === 'on' ? 'OFF' : 'ON'}`}
            </button>
          </div>
        </div>
      </div>

      {/* AI Auto-Control */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-xl font-bold mb-4">🤖 AI Auto-Control</h2>
        <p className="text-gray-700 mb-4 text-sm">
          Let AI automatically manage the fan based on temperature:
        </p>
        <ul className="text-sm text-gray-600 space-y-2 mb-4">
          <li>✓ If temp &gt; 27°C → Fan ON</li>
          <li>✓ If temp ≤ 27°C → Fan OFF</li>
          <li>✓ Updates every minute</li>
        </ul>
        <button
          onClick={handleAutoControl}
          disabled={loading}
          className={`
            w-full py-3 rounded-lg font-bold text-white bg-purple-500 hover:bg-purple-600 transition-all
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {loading ? '⏳ Activating...' : '🚀 Activate Auto-Control'}
        </button>
      </div>

      {/* Response Message */}
      {response && (
        <div className={`p-4 rounded-lg text-center font-bold ${
          response.includes('❌')
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {response}
        </div>
      )}

      {/* Device History */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-6">
        <h2 className="text-xl font-bold mb-4">📋 Control History</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span>Fan turned ON</span>
            <span className="text-gray-500">2 hours ago</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span>Fan turned OFF</span>
            <span className="text-gray-500">4 hours ago</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span>Auto-control activated</span>
            <span className="text-gray-500">Yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
}
