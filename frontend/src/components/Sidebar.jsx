// import React from 'react';

// export default function Sidebar({ activePage, setActivePage }) {
//   const menuItems = [
//     { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'bg-blue-100 text-blue-600' },
//     { id: 'notifications', label: 'Notifications', icon: '🔔', color: 'bg-red-100 text-red-600' },
//     { id: 'control', label: 'Control Panel', icon: '⚙️', color: 'bg-green-100 text-green-600' }
//   ];

//   return (
//     <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white h-screen shadow-lg flex flex-col">
      
//       {/* Logo/Header */}
//       <div className="p-6 border-b border-slate-700">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           🌱 BioPod
//         </h1>
//         <p className="text-xs text-slate-400 mt-1">Smart Farm System</p>
//       </div>

//       {/* Menu Items */}
//       <nav className="flex-1 p-4 space-y-2">
//         {menuItems.map(item => (
//           <button
//             key={item.id}
//             onClick={() => setActivePage(item.id)}
//             className={`
//               w-full px-4 py-3 rounded-lg font-medium transition-all
//               flex items-center gap-3
//               ${activePage === item.id
//                 ? `${item.color} shadow-lg scale-105`
//                 : 'text-slate-300 hover:bg-slate-700 hover:text-white'
//               }
//             `}
//           >
//             <span className="text-xl">{item.icon}</span>
//             <span>{item.label}</span>
//             {activePage === item.id && (
//               <span className="ml-auto">✓</span>
//             )}
//           </button>
//         ))}
//       </nav>

//       {/* Footer */}
//       <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
//         <p>🔴 Status: <span className="text-green-400">Connected</span></p>
//         <p className="mt-2">Last update: now</p>
//       </div>
//     </div>
//   );
// }

import React from 'react';

export default function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠', color: 'bg-blue-100 text-blue-600' },
    // { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'graphs', label: 'Graphs', icon: '📈', color: 'bg-green-100 text-green-600' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', color: 'bg-red-100 text-red-600' },
    { id: 'control', label: 'Control Panel', icon: '⚙️', color: 'bg-yellow-100 text-yellow-600' }
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white h-screen shadow-lg flex flex-col fixed left-0 top-0 overflow-y-auto">
      
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🌱 BioPod
        </h1>
        <p className="text-xs text-slate-400 mt-1">Smart Farm System</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`
              w-full px-4 py-3 rounded-lg font-medium transition-all
              flex items-center gap-3
              ${activePage === item.id
                ? `${item.color} shadow-lg scale-105`
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
            {activePage === item.id && (
              <span className="ml-auto">✓</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
        <p>🔴 Status: <span className="text-green-400">Connected</span></p>
        <p className="mt-2">Last update: now</p>
      </div>
    </div>
  );
}
