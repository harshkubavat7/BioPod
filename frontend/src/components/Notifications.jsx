// import React, { useState, useEffect } from 'react';

// export default function Notifications() {
//   const [alerts, setAlerts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAlerts();
//     const interval = setInterval(fetchAlerts, 30000); // refresh every 30 sec
//     return () => clearInterval(interval);
//   }, []);

//   const fetchAlerts = async () => {
//     try {
//       // For now, we'll show mock alerts
//       // Later this will fetch from /api/alerts
//       const mockAlerts = [
//         {
//           id: 1,
//           type: 'temperature',
//           severity: 'warning',
//           message: '⚠️ Temperature approaching limit',
//           details: 'Current: 27.5°C, Limit: 28°C',
//           timestamp: new Date(Date.now() - 5 * 60000),
//           icon: '🌡️'
//         },
//         {
//           id: 2,
//           type: 'humidity',
//           severity: 'info',
//           message: 'ℹ️ Humidity optimal',
//           details: 'Current: 55%, Range: 50-65%',
//           timestamp: new Date(Date.now() - 15 * 60000),
//           icon: '💧'
//         },
//         {
//           id: 3,
//           type: 'airquality',
//           severity: 'success',
//           message: '✅ Air quality good',
//           details: 'Current: 1200 ppm',
//           timestamp: new Date(Date.now() - 30 * 60000),
//           icon: '🌫️'
//         }
//       ];

//       setAlerts(mockAlerts);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching alerts:', error);
//       setLoading(false);
//     }
//   };

//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case 'danger': return 'bg-red-100 border-l-4 border-red-500';
//       case 'warning': return 'bg-yellow-100 border-l-4 border-yellow-500';
//       case 'info': return 'bg-blue-100 border-l-4 border-blue-500';
//       case 'success': return 'bg-green-100 border-l-4 border-green-500';
//       default: return 'bg-gray-100 border-l-4 border-gray-500';
//     }
//   };

//   const getSeverityTextColor = (severity) => {
//     switch (severity) {
//       case 'danger': return 'text-red-700';
//       case 'warning': return 'text-yellow-700';
//       case 'info': return 'text-blue-700';
//       case 'success': return 'text-green-700';
//       default: return 'text-gray-700';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="p-8 text-center">
//         <p>Loading notifications...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-8 max-w-4xl">
//       <h1 className="text-3xl font-bold mb-2">🔔 Notifications & Alerts</h1>
//       <p className="text-gray-600 mb-8">AI-generated alerts about your farm conditions</p>

//       {alerts.length === 0 ? (
//         <div className="bg-green-100 border-l-4 border-green-500 p-6 rounded text-center">
//           <p className="text-lg font-bold text-green-700">✅ All systems normal!</p>
//           <p className="text-sm text-green-600">No active alerts at this time</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {alerts.map(alert => (
//             <div key={alert.id} className={`${getSeverityColor(alert.severity)} p-6 rounded shadow`}>
//               <div className="flex items-start gap-4">
//                 <div className="text-3xl">{alert.icon}</div>
//                 <div className="flex-1">
//                   <h3 className={`font-bold text-lg ${getSeverityTextColor(alert.severity)}`}>
//                     {alert.message}
//                   </h3>
//                   <p className="text-sm text-gray-700 mt-1">{alert.details}</p>
//                   <p className="text-xs text-gray-500 mt-2">
//                     {alert.timestamp.toLocaleTimeString()}
//                   </p>
//                 </div>
//                 <button className="text-gray-400 hover:text-gray-600">✕</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Alert Settings */}
//       <div className="mt-12 bg-white p-6 rounded shadow border border-gray-200">
//         <h2 className="text-xl font-bold mb-4">⚙️ Alert Thresholds</h2>
//         <div className="grid grid-cols-3 gap-6">
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               🌡️ Temperature Max (°C)
//             </label>
//             <input
//               type="number"
//               defaultValue="28"
//               className="w-full px-3 py-2 border border-gray-300 rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               💧 Humidity Max (%)
//             </label>
//             <input
//               type="number"
//               defaultValue="70"
//               className="w-full px-3 py-2 border border-gray-300 rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               🌫️ Air Quality Max (ppm)
//             </label>
//             <input
//               type="number"
//               defaultValue="1500"
//               className="w-full px-3 py-2 border border-gray-300 rounded"
//             />
//           </div>
//         </div>
//         <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded font-bold hover:bg-blue-600">
//           💾 Save Thresholds
//         </button>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';

export default function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      // Try to fetch from backend
      const res = await fetch('http://localhost:8000/api/alerts');
      const json = await res.json();
      
      if (json.success && json.alerts) {
        setAlerts(json.alerts);
      } else {
        // If backend doesn't have alerts, show default alerts based on real data
        const graphRes = await fetch('http://localhost:8000/api/dashboard/graphs');
        const graphJson = await graphRes.json();
        
        if (graphJson.success && graphJson.sensorData) {
          const raw = graphJson.sensorData;
          const temps = raw.filter(d => d.sensor_type === 'bsf_temperature').map(d => d.value);
          const humids = raw.filter(d => d.sensor_type === 'bsf_humidity').map(d => d.value);
          const aqs = raw.filter(d => d.sensor_type === 'bsf_air_quality').map(d => d.value);

          const lastTemp = temps[temps.length - 1] || 0;
          const lastHumid = humids[humids.length - 1] || 0;
          const lastAq = aqs[aqs.length - 1] || 0;

          const generatedAlerts = [];

          if (lastTemp > 28) {
            generatedAlerts.push({
              id: 1,
              type: 'temperature',
              severity: 'danger',
              message: '🔴 Temperature WARNING',
              details: `Current: ${lastTemp}°C, Limit: 28°C. Turn on fan!`,
              timestamp: new Date(),
              icon: '🌡️'
            });
          } else if (lastTemp > 26) {
            generatedAlerts.push({
              id: 1,
              type: 'temperature',
              severity: 'warning',
              message: '⚠️ Temperature approaching limit',
              details: `Current: ${lastTemp}°C, Limit: 28°C`,
              timestamp: new Date(),
              icon: '🌡️'
            });
          }

          if (lastHumid > 70) {
            generatedAlerts.push({
              id: 2,
              type: 'humidity',
              severity: 'warning',
              message: '⚠️ High Humidity',
              details: `Current: ${lastHumid}%, Range: 50-65%`,
              timestamp: new Date(),
              icon: '💧'
            });
          } else {
            generatedAlerts.push({
              id: 2,
              type: 'humidity',
              severity: 'success',
              message: '✅ Humidity optimal',
              details: `Current: ${lastHumid}%, Range: 50-65%`,
              timestamp: new Date(),
              icon: '💧'
            });
          }

          if (lastAq > 1500) {
            generatedAlerts.push({
              id: 3,
              type: 'airquality',
              severity: 'warning',
              message: '⚠️ Air Quality Low',
              details: `Current: ${lastAq} ppm, Optimal: <1200`,
              timestamp: new Date(),
              icon: '🌫️'
            });
          } else {
            generatedAlerts.push({
              id: 3,
              type: 'airquality',
              severity: 'success',
              message: '✅ Air quality good',
              details: `Current: ${lastAq} ppm`,
              timestamp: new Date(),
              icon: '🌫️'
            });
          }

          setAlerts(generatedAlerts);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'danger': return 'bg-red-100 border-l-4 border-red-500';
      case 'warning': return 'bg-yellow-100 border-l-4 border-yellow-500';
      case 'info': return 'bg-blue-100 border-l-4 border-blue-500';
      case 'success': return 'bg-green-100 border-l-4 border-green-500';
      default: return 'bg-gray-100 border-l-4 border-gray-500';
    }
  };

  const getSeverityTextColor = (severity) => {
    switch (severity) {
      case 'danger': return 'text-red-700';
      case 'warning': return 'text-yellow-700';
      case 'info': return 'text-blue-700';
      case 'success': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  if (loading) {
    return <div className="ml-64 p-8">Loading notifications...</div>;
  }

  return (
    <div className="ml-64 p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">🔔 Notifications & Alerts</h1>
      <p className="text-gray-600 mb-8">AI-generated alerts about your farm conditions</p>

      {alerts.length === 0 ? (
        <div className="bg-green-100 border-l-4 border-green-500 p-6 rounded text-center">
          <p className="text-lg font-bold text-green-700">✅ All systems normal!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className={`${getSeverityColor(alert.severity)} p-6 rounded shadow`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">{alert.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${getSeverityTextColor(alert.severity)}`}>
                    {alert.message}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">{alert.details}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Thresholds */}
      <div className="mt-12 bg-white p-6 rounded shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4">⚙️ Alert Thresholds</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🌡️ Temp Max (°C)</label>
            <input type="number" defaultValue="28" className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">💧 Humidity Max (%)</label>
            <input type="number" defaultValue="70" className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🌫️ AQ Max (ppm)</label>
            <input type="number" defaultValue="1500" className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
        </div>
        <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded font-bold hover:bg-blue-600">
          💾 Save Thresholds
        </button>
      </div>
    </div>
  );
}
