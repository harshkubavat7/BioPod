
// import React, { useState, useEffect } from 'react';
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// export default function Home() {
//   const [data, setData] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [initialLoaded, setInitialLoaded] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [gRes, sRes] = await Promise.all([
//           fetch('http://localhost:8000/api/dashboard/graphs'),
//           fetch('http://localhost:8000/api/dashboard/stats')
//         ]);

//         if (!gRes.ok || !sRes.ok) {
//           throw new Error(`HTTP ${gRes.status} / ${sRes.status}`);
//         }

//         const gJson = await gRes.json();
//         const sJson = await sRes.json();

//         if (!gJson.success || !sJson.success) {
//           throw new Error('API returned error');
//         }

//         const raw = gJson.sensorData || [];
//         console.log('Raw sensor data:', raw);

//         // ✅ NEW: Group by time bucket (every 5 minutes)
//         const grouped = {};
        
//         raw.forEach(d => {
//           // Round timestamp to nearest 5 minutes
//           const time = new Date(d.timestamp);
//           const minutes = time.getMinutes();
//           const bucket = Math.floor(minutes / 5) * 5;
//           time.setMinutes(bucket);
//           time.setSeconds(0);
//           time.setMilliseconds(0);
          
//           const key = time.toISOString();
          
//           if (!grouped[key]) {
//             grouped[key] = { timestamp: d.timestamp, time: key };
//           }
          
//           if (d.sensor_type === 'bsf_temperature') {
//             grouped[key].temperature = d.value;
//           } else if (d.sensor_type === 'bsf_humidity') {
//             grouped[key].humidity = d.value;
//           } else if (d.sensor_type === 'bsf_air_quality') {
//             grouped[key].airQuality = d.value;
//           }
//         });

//         // Convert to array and sort
//         const points = Object.values(grouped)
//           .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
//           .filter(p => p.temperature && p.humidity && p.airQuality); // Only include complete data points

//         console.log('Processed points:', points);
//         setData(points);
//         setStats(sJson.stats);
//         setError(null);
//         setInitialLoaded(true);
//       } catch (e) {
//         console.error('Fetch error:', e);
//         setError(e.message);
//         setInitialLoaded(true);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   if (!initialLoaded) {
//     return (
//       <div className="w-full p-8 flex items-center justify-center">
//         <p className="text-xl text-gray-600">Loading...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full p-8">
//         <p className="text-red-500 font-bold">❌ Error: {error}</p>
//       </div>
//     );
//   }

//   if (!data.length || !stats) {
//     return (
//       <div className="w-full p-8">
//         <p className="text-gray-500">⚠️ No complete sensor data available yet</p>
//       </div>
//     );
//   }

//   const times = data.map(d => new Date(d.timestamp).toLocaleTimeString());
//   const temps = data.map(d => d.temperature ?? 0);
//   const humids = data.map(d => d.humidity ?? 0);
//   const aqs = data.map(d => d.airQuality ?? 0);

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: { legend: { display: false } },
//     scales: { y: { beginAtZero: false } }
//   };

//   return (
//     <div className="w-full ml-80 p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl">
//         <h1 className="text-4xl font-bold mb-2">🏠 Home Dashboard</h1>
//         <p className="text-gray-600 mb-8">Welcome to BioPod - Your Smart Farm System</p>

//         {/* Quick Stats Cards */}
//         {stats && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//             {/* User Info Card */}
//             <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">👤 User</p>
//               <p className="text-2xl font-bold">Farm Owner</p>
//               <p className="text-xs mt-2">Ratanpar, Gujarat</p>
//             </div>

//             {/* Date & Time Card */}
//             <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">📅 Date & Time</p>
//               <p className="text-xl font-bold">{new Date().toLocaleDateString()}</p>
//               <p className="text-xs mt-2">{new Date().toLocaleTimeString()}</p>
//             </div>

//             {/* Temperature Card */}
//             <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">🌡️ Temperature</p>
//               <p className="text-3xl font-bold">{stats.temperature.current}°C</p>
//               <p className="text-xs mt-2">Avg: {stats.temperature.avg}°C</p>
//             </div>

//             {/* Humidity Card */}
//             <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">💧 Humidity</p>
//               <p className="text-3xl font-bold">{stats.humidity.current}%</p>
//               <p className="text-xs mt-2">Avg: {stats.humidity.avg}%</p>
//             </div>

//             {/* Air Quality Card */}
//             <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">🌫️ Air Quality</p>
//               <p className="text-3xl font-bold">{stats.airQuality.current}</p>
//               <p className="text-xs mt-2">ppm</p>
//             </div>

//             {/* Status Card */}
//             <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">✅ System Status</p>
//               <p className="text-xl font-bold">All Good</p>
//               <p className="text-xs mt-2">No alerts</p>
//             </div>

//             {/* Device Count Card */}
//             <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">📡 Devices</p>
//               <p className="text-3xl font-bold">3</p>
//               <p className="text-xs mt-2">All connected</p>
//             </div>

//             {/* Uptime Card */}
//             <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-lg shadow">
//               <p className="text-sm opacity-80">⏱️ Uptime</p>
//               <p className="text-2xl font-bold">99.9%</p>
//               <p className="text-xs mt-2">Last 30 days</p>
//             </div>
//           </div>
//         )}

//         {/* Mini Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Mini Temperature Chart */}
//           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
//             <h3 className="font-bold mb-4 text-lg">🌡️ Temperature Trend</h3>
//             <div style={{ height: '200px' }}>
//               <Line
//                 data={{
//                   labels: times.slice(-12),
//                   datasets: [{
//                     label: 'Temperature (°C)',
//                     data: temps.slice(-12),
//                     borderColor: '#ff6b6b',
//                     backgroundColor: 'rgba(255, 107, 107, 0.1)',
//                     tension: 0.4,
//                     fill: true,
//                     pointRadius: 2
//                   }]
//                 }}
//                 options={chartOptions}
//               />
//             </div>
//           </div>

//           {/* Mini Humidity Chart */}
//           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
//             <h3 className="font-bold mb-4 text-lg">💧 Humidity Trend</h3>
//             <div style={{ height: '200px' }}>
//               <Line
//                 data={{
//                   labels: times.slice(-12),
//                   datasets: [{
//                     label: 'Humidity (%)',
//                     data: humids.slice(-12),
//                     borderColor: '#4ecdc4',
//                     backgroundColor: 'rgba(78, 205, 196, 0.1)',
//                     tension: 0.4,
//                     fill: true,
//                     pointRadius: 2
//                   }]
//                 }}
//                 options={chartOptions}
//               />
//             </div>
//           </div>

//           {/* Mini Air Quality Chart */}
//           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
//             <h3 className="font-bold mb-4 text-lg">🌫️ Air Quality Trend</h3>
//             <div style={{ height: '200px' }}>
//               <Line
//                 data={{
//                   labels: times.slice(-12),
//                   datasets: [{
//                     label: 'Air Quality (ppm)',
//                     data: aqs.slice(-12),
//                     borderColor: '#ffd93d',
//                     backgroundColor: 'rgba(255, 217, 61, 0.1)',
//                     tension: 0.4,
//                     fill: true,
//                     pointRadius: 2
//                   }]
//                 }}
//                 options={chartOptions}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

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

export default function Home() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/dashboard/graphs');
        const json = await res.json();

        if (!json.success || !json.sensorData) {
          throw new Error('No sensor data');
        }

        const raw = json.sensorData;
        console.log('✅ Raw sensor data:', raw.length, 'readings');

        const temps = raw.filter(d => d.sensor_type === 'bsf_temperature').map(d => d.value);
        const humids = raw.filter(d => d.sensor_type === 'bsf_humidity').map(d => d.value);
        const aqs = raw.filter(d => d.sensor_type === 'bsf_air_quality').map(d => d.value);

        const makeStats = (arr) => {
          if (arr.length === 0) return { current: 0, min: 0, max: 0, avg: 0 };
          return {
            current: arr[arr.length - 1],
            min: Math.min(...arr),
            max: Math.max(...arr),
            avg: +(arr.reduce((a, b) => a + b) / arr.length).toFixed(1)
          };
        };

        const calculatedStats = {
          temperature: makeStats(temps),
          humidity: makeStats(humids),
          airQuality: makeStats(aqs)
        };

        console.log('📊 Current readings:');
        console.log('  Temp:', calculatedStats.temperature.current, '°C');
        console.log('  Humidity:', calculatedStats.humidity.current, '%');
        console.log('  Air Quality:', calculatedStats.airQuality.current, 'ppm');

        setStats(calculatedStats);

        const grouped = {};
        raw.forEach(item => {
          const minute = new Date(item.timestamp);
          minute.setSeconds(0);
          minute.setMilliseconds(0);
          const key = minute.getTime();

          if (!grouped[key]) {
            grouped[key] = {
              time: item.timestamp,
              temperature: null,
              humidity: null,
              airQuality: null
            };
          }

          if (item.sensor_type === 'bsf_temperature') {
            grouped[key].temperature = item.value;
          } else if (item.sensor_type === 'bsf_humidity') {
            grouped[key].humidity = item.value;
          } else if (item.sensor_type === 'bsf_air_quality') {
            grouped[key].airQuality = item.value;
          }
        });

        const points = Object.values(grouped)
          .sort((a, b) => new Date(a.time) - new Date(b.time))
          .slice(-20);

        setChartData(points);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error:', error.message);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full p-8">
        <p className="text-red-500 font-bold">No data available</p>
      </div>
    );
  }

  const times = chartData.map(d => new Date(d.time).toLocaleTimeString());
  const temps = chartData.map(d => d.temperature ?? 0);
  const humids = chartData.map(d => d.humidity ?? 0);
  const aqs = chartData.map(d => d.airQuality ?? 0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } }
  };

  return (
    <div className="w-full ml-80 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl">
        <h1 className="text-4xl font-bold mb-2">🏠 Home Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to BioPod - Your Smart Farm System</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">👤 User</p>
            <p className="text-2xl font-bold">Farm Owner</p>
            <p className="text-xs mt-2">Ratanpar, Gujarat</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">📅 Date & Time</p>
            <p className="text-xl font-bold">{new Date().toLocaleDateString()}</p>
            <p className="text-xs mt-2">{new Date().toLocaleTimeString()}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">🌡️ Temperature</p>
            <p className="text-3xl font-bold">{stats.temperature.current}°C</p>
            <p className="text-xs mt-2">
              Min: {stats.temperature.min}°C | Max: {stats.temperature.max}°C | Avg: {stats.temperature.avg}°C
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">💧 Humidity</p>
            <p className="text-3xl font-bold">{stats.humidity.current}%</p>
            <p className="text-xs mt-2">
              Min: {stats.humidity.min}% | Max: {stats.humidity.max}% | Avg: {stats.humidity.avg}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">🌫️ Air Quality</p>
            <p className="text-3xl font-bold">{stats.airQuality.current}</p>
            <p className="text-xs mt-2">
              Min: {stats.airQuality.min} | Max: {stats.airQuality.max} | Avg: {stats.airQuality.avg} ppm
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">✅ System Status</p>
            <p className="text-xl font-bold">All Good</p>
            <p className="text-xs mt-2">No alerts</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">📡 Devices</p>
            <p className="text-3xl font-bold">3</p>
            <p className="text-xs mt-2">All connected</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm opacity-80">⏱️ Uptime</p>
            <p className="text-2xl font-bold">99.9%</p>
            <p className="text-xs mt-2">Last 30 days</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="font-bold mb-4 text-lg">🌡️ Temperature Trend</h3>
              <div style={{ height: '200px' }}>
                <Line
                  data={{
                    labels: times,
                    datasets: [{
                      label: 'Temperature (°C)',
                      data: temps,
                      borderColor: '#ff6b6b',
                      backgroundColor: 'rgba(255, 107, 107, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 2
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="font-bold mb-4 text-lg">💧 Humidity Trend</h3>
              <div style={{ height: '200px' }}>
                <Line
                  data={{
                    labels: times,
                    datasets: [{
                      label: 'Humidity (%)',
                      data: humids,
                      borderColor: '#4ecdc4',
                      backgroundColor: 'rgba(78, 205, 196, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 2
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="font-bold mb-4 text-lg">🌫️ Air Quality Trend</h3>
              <div style={{ height: '200px' }}>
                <Line
                  data={{
                    labels: times,
                    datasets: [{
                      label: 'Air Quality (ppm)',
                      data: aqs,
                      borderColor: '#ffd93d',
                      backgroundColor: 'rgba(255, 217, 61, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 2
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}