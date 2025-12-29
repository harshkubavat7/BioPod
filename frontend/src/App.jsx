import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AlertsWidget from './components/AlertsWidget';
import Chatbot from './components/Chatbot';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <p className='text-3xl'>Hello</p> */}
      <AlertsWidget />
      <Chatbot />

    </>
  )
}

export default App
