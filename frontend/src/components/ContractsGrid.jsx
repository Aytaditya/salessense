function Card({ title, description }) {
    return (
      <div className="rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] p-6 hover:bg-yellow-500/90 cursor-pointer transition-colors">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-400/60 text-white"
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <p className="mt-3 text-gray-300 leading-relaxed text-sm">{description}</p>
      </div>
    )
  }
  
  export default function ContractsGrid() {
    return (
      <section className="mx-auto max-w-6xl">
        <div
          className="
            grid gap-6
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          <Card
            title="Contract Analyzer"
            description="A tool that enables businesses to upload contracts, generate instant summaries and engage in interactive conversations with them."
          />
  
          <Card
            title="Contract Comparison"
            description="A tool that enable businesses to compare different versions of contract seemlessly."
          />
  
          {/* Image feature tile — spans taller area on large screens */}
          <div
            className="
              rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] p-6
              lg:row-span-2
              flex flex-col
              hover:bg-[#D93954]
            "
          >
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold text-white">Contract Mind Palace</h3>
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-400/60 text-gray-200"
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <path
                    d="M8 5l8 7-8 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
  
            <p className="mt-3 text-gray-300 leading-relaxed text-sm">
              A tool that executes intelligent queries across a predefined contract repository.
            </p>
  
            <div className="mt-6 relative  overflow-hidden  flex-1 flex items-center justify-center">
              <img
                src="/cyber-brain.png"
                alt="Brain"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
  
          <Card
            title="Contract Redaction"
            description="A tool that removes or obscures sensitive or confidential information from documents before sharing or publishing."
          />
  
          <Card title="Contract Extraction" description="A tool that extracts predefined tags from contract." />
        </div>
      </section>
    )
  }
  