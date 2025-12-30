import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Graphs() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/dashboard/graphs');
        const json = await res.json();
        if (!json.success || !json.sensorData) throw new Error('No sensor data');

        const raw = json.sensorData;
        const temps = raw.filter(d => d.sensor_type === 'bsf_temperature').map(d => d.value);
        const humids = raw.filter(d => d.sensor_type === 'bsf_humidity').map(d => d.value);
        const aqs = raw.filter(d => d.sensor_type === 'bsf_air_quality').map(d => d.value);

        const makeStats = (arr) => arr.length === 0
          ? { current: 0, min: 0, max: 0, avg: 0 }
          : {
              current: arr[arr.length - 1],
              min: Math.min(...arr),
              max: Math.max(...arr),
              avg: +(arr.reduce((a, b) => a + b) / arr.length).toFixed(1)
            };

        setStats({
          temperature: makeStats(temps),
          humidity: makeStats(humids),
          airQuality: makeStats(aqs)
        });

        const grouped = {};
        raw.forEach(item => {
          const minute = new Date(item.timestamp);
          minute.setSeconds(0, 0);
          const key = minute.getTime();
          if (!grouped[key]) grouped[key] = { time: item.timestamp };
          if (item.sensor_type === 'bsf_temperature') grouped[key].temperature = item.value;
          if (item.sensor_type === 'bsf_humidity') grouped[key].humidity = item.value;
          if (item.sensor_type === 'bsf_air_quality') grouped[key].airQuality = item.value;
        });

        setData(Object.values(grouped).sort((a, b) => new Date(a.time) - new Date(b.time)));
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Loading dashboard...</div>;
  }

  if (!stats || data.length === 0) {
    return <div className="p-8 text-yellow-600 font-semibold">Waiting for sensor data...</div>;
  }

  const times = data.map(d => new Date(d.time).toLocaleTimeString());
  const temps = data.map(d => d.temperature ?? 0);
  const humids = data.map(d => d.humidity ?? 0);
  const aqs = data.map(d => d.airQuality ?? 0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f1f1' } } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-teal-500 p-8">
      <div className="max-w-7xl mx-auto bg-gray-100 rounded-xl p-6">

        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Dashboard</h1>

        {/* Circular stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#ef4444"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (stats.temperature.current / 60) * 351}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-800">{stats.temperature.current}°C</p>
                <p className="text-xs text-gray-500">Temperature</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#06b6d4"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (stats.humidity.current / 100) * 351}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-800">{stats.humidity.current}%</p>
                <p className="text-xs text-gray-500">Humidity</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#facc15"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="351"
                  strokeDashoffset={351 - Math.min(stats.airQuality.current / 500, 1) * 351}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-800">{stats.airQuality.current}</p>
                <p className="text-xs text-gray-500">Air Quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="font-semibold mb-2">Temperature Trend</p>
            <div className="h-64">
              <Line data={{ labels: times, datasets: [{ data: temps, borderColor: '#ec4899', tension: 0.4 }] }} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <p className="font-semibold mb-2">Humidity Trend</p>
            <div className="h-64">
              <Line data={{ labels: times, datasets: [{ data: humids, borderColor: '#06b6d4', tension: 0.4 }] }} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <p className="font-semibold mb-2">Air Quality Trend</p>
            <div className="h-64">
              <Line data={{ labels: times, datasets: [{ data: aqs, borderColor: '#facc15', tension: 0.4 }] }} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <p className="font-semibold mb-2">All Sensors</p>
            <div className="h-64">
              <Line
                data={{
                  labels: times,
                  datasets: [
                    { data: temps, borderColor: '#ec4899', tension: 0.4 },
                    { data: humids, borderColor: '#06b6d4', tension: 0.4 },
                    { data: aqs, borderColor: '#facc15', tension: 0.4 }
                  ]
                }}
                options={{ ...chartOptions, plugins: { legend: { display: true } } }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}