import React from 'react'
import ContractsGrid from '../components/ContractsGrid'

const Contracts = () => {
  return (
    <div className="min-h-screen p-6">
      <img src="/bgLeft.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 right-0" />
      <img src="/bgRight.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 left-0" />

      
      <header className="text-center mb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contracts AI Studio
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Unlock Insights. Simplify Contracts. Power Your Decisions.
          </p>
        </div>
      </header>

      <ContractsGrid/>
      
    </div>
  )
}

export default Contracts
