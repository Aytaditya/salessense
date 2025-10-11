import { useEffect } from "react"
import { Link } from "react-router-dom"


function Card({ title, description, link }) {
    return (
        <Link to={link} className="rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] p-6 hover:bg-red-500 cursor-pointer transition-colors">
            <div className=""
            >
                <div className="flex items-start justify-between">
                    <h3 className="text-2xl font-semibold text-white tracking-tighter">{title}</h3>
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
        </Link>

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
                    link="/contract-analyzer"
                />

                <Card
                    title="Contract Comparison"
                    description="A tool that enables businesses to compare different versions of contracts seamlessly."
                    link="/contract-comparison"
                />

                {/* Mind Palace Card */}
                <Link to="/contract-mind-palace" className="rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] p-6
              lg:row-span-2 flex flex-col hover:bg-[#D93954] transition-colors">
                <div
                    className=" "
                >
                    <div className="flex items-start justify-between">
                        <h3 className="text-2xl font-semibold text-white tracking-tighter">Contract Mind Palace</h3>
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

                    <div className="mt-6 flex-1 min-h-0"> {/* Changed this line */}
                        <img
                            src="/cyber-brain.png"
                            alt="Brain"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
                </Link>

                <Card
                    title="Contract Redaction"
                    description="A tool that removes or obscures sensitive or confidential information from documents before sharing or publishing."
                    link="/contract-redaction"
                />
                <Link to="/contract-extraction">
                <div
                    className="
                    rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] p-6 flex flex-col
                    hover:bg-red-500 transition-colors"
                >
                    <div className="flex items-start justify-between">
                        <h3 className="text-2xl font-semibold text-white tracking-tighter">Contract Extraction</h3>
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
                        A tool that extracts predefined tags from contracts.
                    </p>
                    <div className="mt-6 flex-1 min-h-0">
                        <img
                            src="/contracts-page.png"
                            alt="Futuristic Contract Extraction"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
                </Link>
            </div>
        </section>
    )
}