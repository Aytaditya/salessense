
import {Routes, Route } from 'react-router-dom'
import './index.css'
import HomePage from './pages/HomePage'
import FrontPage from './pages/FrontPage'
import Navbar from './pages/Navbar'
import CortexPage from './pages/CortexPage'
import OrderAgent from './pages/OrderAgent'

function App() {


  return (
    <>
      <div className="flex flex-col h-screen max-h-screen">
        <Navbar/>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/cortex" element={<CortexPage />} />
          <Route path="/order-agent" element={<OrderAgent />} />
        </Routes>
      </div>
    </>
  )
}

export default App
