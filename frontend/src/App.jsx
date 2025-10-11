
import {Routes, Route } from 'react-router-dom'
import './index.css'
import HomePage from './pages/HomePage'
import FrontPage from './pages/FrontPage'
import Navbar from './pages/Navbar'
import CortexPage from './pages/CortexPage'
import OrderAgent from './pages/OrderAgent'
import Contracts from './pages/Contracts'
import ContractAnalyzer from './pages/ContractAnalyzer'
import ContractRedaction from './pages/ContractRedaction'
import ContractComparison from './pages/ContractComparison'
import ContractExtraction from './pages/ContractExtraction'
import ContractMind from './pages/ContractMind'

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
          <Route path="/contracts-page" element={<Contracts/>}/>
          <Route path="/contract-analyzer" element={<ContractAnalyzer/>}/>
          <Route path="/contract-redaction" element={<ContractRedaction/>}/>
          <Route path="/contract-comparison" element={<ContractComparison/>}/>
          <Route path="/contract-extraction" element={<ContractExtraction/>}/>
          <Route path="/contract-mind-palace" element={<ContractMind/>}/>
        </Routes>
      </div>
    </>
  )
}

export default App
