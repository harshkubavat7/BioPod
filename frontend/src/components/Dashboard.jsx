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

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// export default function Dashboard() {
//   const [data, setData] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//   const fetch_data = async () => {
//     try {
//       setLoading(true);

//       const res1 = await fetch('http://localhost:8000/api/dashboard/graphs');
//       const json1 = await res1.json();

//       const res2 = await fetch('http://localhost:8000/api/dashboard/stats');
//       const json2 = await res2.json();

//       if (json1.success && json2.success) {
//         const raw = json1.sensorData || [];

//         // 🔁 group by timestamp and merge sensor types
//         const grouped = {};
//         for (const d of raw) {
//           const t = d.timestamp;
//           if (!grouped[t]) grouped[t] = { timestamp: t };

//           if (d.sensor_type === 'bsf_temperature') {
//             grouped[t].temperature = d.value;
//           } else if (d.sensor_type === 'bsf_humidity') {
//             grouped[t].humidity = d.value;
//           } else if (d.sensor_type === 'bsf_air_quality') {
//             grouped[t].airQuality = d.value;
//           }
//         }

//         const points = Object
//           .values(grouped)
//           .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

//         setData(points);
//         setStats(json2.stats);
//       } else {
//         setError('API error');
//       }
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetch_data();
//   const interval = setInterval(fetch_data, 60000);
//   return () => clearInterval(interval);
// }, []);


//   if (loading) return <div className="p-8">Loading...</div>;
//   if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
//   if (!data || data.length === 0) return <div className="p-8">No data</div>;

//   const times = data.map(d => new Date(d.timestamp).toLocaleTimeString());
//   const temps = data.map(d => d.temperature || 0);
//   const humids = data.map(d => d.humidity || 0);
//   const aqs = data.map(d => d.airQuality || 0);

//   const chartOptions = {
//     responsive: true,
//     plugins: { legend: { position: 'top' } },
//     scales: { y: { beginAtZero: false } }
//   };

//   return (
//     <div className="p-8 bg-white">
//       <h1 className="text-3xl font-bold mb-8">📊 Dashboard</h1>

//       {stats && (
//         <div className="grid grid-cols-3 gap-4 mb-8">
//           <div className="bg-red-100 p-4 rounded">
//             <p className="font-bold">Temp: {stats.temperature.current}°C</p>
//             <p className="text-sm">Min: {stats.temperature.min} Max: {stats.temperature.max}</p>
//           </div>
//           <div className="bg-blue-100 p-4 rounded">
//             <p className="font-bold">Humidity: {stats.humidity.current}%</p>
//             <p className="text-sm">Min: {stats.humidity.min} Max: {stats.humidity.max}</p>
//           </div>
//           <div className="bg-yellow-100 p-4 rounded">
//             <p className="font-bold">AQ: {stats.airQuality.current}</p>
//             <p className="text-sm">Min: {stats.airQuality.min} Max: {stats.airQuality.max}</p>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 gap-8">
//         <div className="bg-gray-50 p-6 rounded border">
//           <h2 className="text-xl font-bold mb-4">🌡️ Temperature</h2>
//           <Line data={{
//             labels: times,
//             datasets: [{
//               label: 'Temperature (°C)',
//               data: temps,
//               borderColor: '#ff6b6b',
//               backgroundColor: 'rgba(255, 107, 107, 0.1)',
//               tension: 0.4,
//               fill: true
//             }]
//           }} options={chartOptions} />
//         </div>

//         <div className="bg-gray-50 p-6 rounded border">
//           <h2 className="text-xl font-bold mb-4">💧 Humidity</h2>
//           <Line data={{
//             labels: times,
//             datasets: [{
//               label: 'Humidity (%)',
//               data: humids,
//               borderColor: '#4ecdc4',
//               backgroundColor: 'rgba(78, 205, 196, 0.1)',
//               tension: 0.4,
//               fill: true
//             }]
//           }} options={chartOptions} />
//         </div>

//         <div className="bg-gray-50 p-6 rounded border">
//           <h2 className="text-xl font-bold mb-4">🌫️ Air Quality</h2>
//           <Line data={{
//             labels: times,
//             datasets: [{
//               label: 'Air Quality Index',
//               data: aqs,
//               borderColor: '#ffd93d',
//               backgroundColor: 'rgba(255, 217, 61, 0.1)',
//               tension: 0.4,
//               fill: true
//             }]
//           }} options={chartOptions} />
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both in parallel
        const [gRes, sRes] = await Promise.all([
          fetch('http://localhost:8000/api/dashboard/graphs'),
          fetch('http://localhost:8000/api/dashboard/stats')
        ]);

        if (!gRes.ok || !sRes.ok) {
          throw new Error('Failed to fetch');
        }

        const gJson = await gRes.json();
        const sJson = await sRes.json();

        if (!gJson.success || !sJson.success) {
          throw new Error('API returned error');
        }

        // Transform sensor data: group by timestamp
        const raw = gJson.sensorData || [];
        const grouped = {};

        for (const d of raw) {
          const t = d.timestamp;
          if (!grouped[t]) grouped[t] = { timestamp: t };

          if (d.sensor_type === 'bsf_temperature') {
            grouped[t].temperature = d.value;
          } else if (d.sensor_type === 'bsf_humidity') {
            grouped[t].humidity = d.value;
          } else if (d.sensor_type === 'bsf_air_quality') {
            grouped[t].airQuality = d.value;
          }
        }

        // Sort by timestamp
        const points = Object.values(grouped).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // ✅ Only update on SUCCESS - keep old data if fetch fails
        setData(points);
        setStats(sJson.stats);
        setError(null);
        setInitialLoaded(true);

      } catch (e) {
        console.error('[Dashboard] Fetch error:', e.message);
        // ❌ On error, keep old data - do NOT blank the graphs
        setError(e.message);
        setInitialLoaded(true); // still mark as loaded so we show something
      }
    };

    fetchData(); // Initial load

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Show loading only on first load
  if (!initialLoaded) {
    return <div className="p-8 text-center text-lg">Loading dashboard...</div>;
  }

  // If no data even after first load, show message
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-red-500">No sensor data available</div>;
  }

  // Build chart arrays
  const times = data.map(d => new Date(d.timestamp).toLocaleTimeString());
  const temps = data.map(d => d.temperature ?? 0);
  const humids = data.map(d => d.humidity ?? 0);
  const aqs = data.map(d => d.airQuality ?? 0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: false } }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        {error && (
          <p className="text-sm text-yellow-600">⚠️ {error}</p>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-red-100 p-6 rounded border-l-4 border-red-500">
            <p className="font-bold text-lg">🌡️ Temp: {stats.temperature.current}°C</p>
            <p className="text-sm text-gray-700">
              Min: {stats.temperature.min} | Max: {stats.temperature.max} | Avg: {stats.temperature.avg}
            </p>
          </div>

          <div className="bg-blue-100 p-6 rounded border-l-4 border-blue-500">
            <p className="font-bold text-lg">💧 Humidity: {stats.humidity.current}%</p>
            <p className="text-sm text-gray-700">
              Min: {stats.humidity.min} | Max: {stats.humidity.max} | Avg: {stats.humidity.avg}
            </p>
          </div>

          <div className="bg-yellow-100 p-6 rounded border-l-4 border-yellow-500">
            <p className="font-bold text-lg">🌫️ AQ: {stats.airQuality.current}</p>
            <p className="text-sm text-gray-700">
              Min: {stats.airQuality.min} | Max: {stats.airQuality.max} | Avg: {stats.airQuality.avg}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Temperature Chart */}
        <div className="bg-gray-50 p-6 rounded border">
          <h2 className="text-xl font-bold mb-4">🌡️ Temperature Trend</h2>
          <Line
            data={{
              labels: times,
              datasets: [
                {
                  label: 'Temperature (°C)',
                  data: temps,
                  borderColor: '#ff6b6b',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 3,
                  pointBackgroundColor: '#ff6b6b'
                }
              ]
            }}
            options={chartOptions}
          />
        </div>

        {/* Humidity Chart */}
        <div className="bg-gray-50 p-6 rounded border">
          <h2 className="text-xl font-bold mb-4">💧 Humidity Trend</h2>
          <Line
            data={{
              labels: times,
              datasets: [
                {
                  label: 'Humidity (%)',
                  data: humids,
                  borderColor: '#4ecdc4',
                  backgroundColor: 'rgba(78, 205, 196, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 3,
                  pointBackgroundColor: '#4ecdc4'
                }
              ]
            }}
            options={chartOptions}
          />
        </div>

        {/* Air Quality Chart */}
        <div className="bg-gray-50 p-6 rounded border">
          <h2 className="text-xl font-bold mb-4">🌫️ Air Quality Trend</h2>
          <Line
            data={{
              labels: times,
              datasets: [
                {
                  label: 'Air Quality Index (ppm)',
                  data: aqs,
                  borderColor: '#ffd93d',
                  backgroundColor: 'rgba(255, 217, 61, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 3,
                  pointBackgroundColor: '#ffd93d'
                }
              ]
            }}
            options={chartOptions}
          />
        </div>

      </div>

      {/* Last update info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Auto-refreshes every 60 seconds
      </div>
    </div>
  );
}
