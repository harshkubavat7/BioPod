
// import React, { useState } from 'react';
// import Sidebar from './components/Sidebar';
// import Home from './components/Home';
// import Dashboard from './components/Dashboard';
// import Graphs from './components/Graphs';
// import Notifications from './components/Notifications';
// import ControlPanel from './components/ControlPanel';
// import Chatbot from './components/Chatbot';

// export default function App() {
//   const [activePage, setActivePage] = useState('home');
//   const [chatOpen, setChatOpen] = useState(false);

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <Sidebar activePage={activePage} setActivePage={setActivePage} />

//       {/* Main Content */}
//       <div className="flex-1 overflow-auto">
//         {activePage === 'home' && <Home />}
//         {/* {activePage === 'dashboard' && <Dashboard />} */}
//         {activePage === 'graphs' && <Graphs />}
//         {activePage === 'notifications' && <Notifications />}
//         {activePage === 'control' && <ControlPanel />}
//       </div>

//       {/* Chatbot Widget */}
//       <Chatbot open={chatOpen} setOpen={setChatOpen} />

//       {/* Chatbot Toggle Button */}
//       <button
//         onClick={() => setChatOpen(!chatOpen)}
//         className="fixed bottom-8 right-8 w-14 h-14 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl z-50 transition-all"
//         title="Open ChatBot"
//       >
//         💬
//       </button>
//     </div>
//   );
// }

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Graphs from './components/Graphs';
import Notifications from './components/Notifications';
import ControlPanel from './components/ControlPanel';
import Chatbot from './components/Chatbot';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 z-40">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
      </div>
    {activePage === 'home' && <Home />}
      {/* Main Content Area - Add padding for sidebar */}
      <div className="flex-1 pl-64 h-screen overflow-auto">
        
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'graphs' && <Graphs />}
        {activePage === 'notifications' && <Notifications />}
        {activePage === 'control' && <ControlPanel />}
      </div>

      {/* Chatbot Widget */}
      <Chatbot open={chatOpen} setOpen={setChatOpen} />

      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl z-50 transition-all"
        title="Open ChatBot"
      >
        💬
      </button>
    </div>
  );
}
