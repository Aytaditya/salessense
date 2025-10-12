import React, { useRef, useState, useCallback } from 'react'
import { ArrowLeft } from "lucide-react"
import ReactMarkdown from 'react-markdown'

const ContractComparison = () => {
  const fileInputRef1 = useRef(null)
  const fileInputRef2 = useRef(null)
  const [pdfUrl1, setPdfUrl1] = useState(null)
  const [pdfUrl2, setPdfUrl2] = useState(null)
  const [fileName1, setFileName1] = useState("")
  const [fileName2, setFileName2] = useState("")
  const [dragActive1, setDragActive1] = useState(false)
  const [dragActive2, setDragActive2] = useState(false)
  const [activeTab, setActiveTab] = useState('original') // 'original' or 'new'
  const [summary, setSummary] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [file1,setFile1]=useState(null)
  const [file2,setFile2]=useState(null)

  const goBack = () => {
    window.history.back()
  }

  const pickFile1 = () => fileInputRef1.current?.click()
  const pickFile2 = () => fileInputRef2.current?.click()

  const handleFiles1 = useCallback((files) => {
    const file = files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.")
      return
    }
    const url = URL.createObjectURL(file)
    setPdfUrl1((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setFileName1(file.name)
    setFile1(file)
  }, [])

  const handleFiles2 = useCallback((files) => {
    const file = files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.")
      return
    }
    const url = URL.createObjectURL(file)
    setPdfUrl2((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setFileName2(file.name)
    setFile2(file)
  }, [])

  const onInputChange1 = (e) => handleFiles1(e.target.files)
  const onInputChange2 = (e) => handleFiles2(e.target.files)

  const onDragOver1 = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive1(true)
  }

  const onDragLeave1 = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive1(false)
  }

  const onDrop1 = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive1(false)
    const dt = e.dataTransfer
    if (dt?.files?.length) handleFiles1(dt.files)
  }

  const onDragOver2 = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive2(true)
  }

  const onDragLeave2 = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive2(false)
  }

  const onDrop2 = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive2(false)
    const dt = e.dataTransfer
    if (dt?.files?.length) handleFiles2(dt.files)
  }

  const removeFile1 = () => {
    if (pdfUrl1) URL.revokeObjectURL(pdfUrl1)
    setPdfUrl1(null)
    setFileName1("")
    setFile1(null)
    if (fileInputRef1.current) fileInputRef1.current.value = ""
  }

  const removeFile2 = () => {
    if (pdfUrl2) URL.revokeObjectURL(pdfUrl2)
    setPdfUrl2(null)
    setFileName2("")
    setFile2(null)
    if (fileInputRef2.current) fileInputRef2.current.value = ""
  }

  // Function to format the backend response as markdown
  const formatComparisonAsMarkdown = (differences) => {
    if (!differences) return ""

    let markdown = "# Contract Comparison Summary\n\n"
    markdown += "## Key Differences Between Contracts\n\n"

    Object.entries(differences).forEach(([key, value]) => {
      if (key === "Extra Clauses in A" || key === "Extra Clauses in B") {
        markdown += `## ${key}\n\n`
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            markdown += `${index + 1}. ${item}\n`
          })
        } else {
          markdown += `${value}\n`
        }
        markdown += "\n"
      } else if (typeof value === 'object' && value !== null) {
        // Handle the nested object structure with Contract A, Contract B, and Difference
        markdown += `### ${key}\n\n`
        
        if (value['Contract A']) {
          markdown += `**Contract A:** ${value['Contract A']}\n\n`
        }
        
        if (value['Contract B']) {
          markdown += `**Contract B:** ${value['Contract B']}\n\n`
        }
        
        if (value['Difference']) {
          markdown += `**Difference:** ${value['Difference']}\n\n`
        }
        
        markdown += "---\n\n"
      } else {
        // Fallback for any other types
        markdown += `### ${key}\n\n${value}\n\n`
      }
    })

    return markdown
  }

  // Custom components for ReactMarkdown
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-4 mb-3 border-b border-gray-600 pb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-white mt-4 mb-2 text-red-400" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-md font-semibold text-white mt-3 mb-2 text-yellow-400" {...props} />,
    p: ({node, ...props}) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1 ml-4" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1 ml-4" {...props} />,
    li: ({node, ...props}) => <li className="mb-1" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
    em: ({node, ...props}) => <em className="italic text-gray-400" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500 pl-4 my-3 text-gray-400 italic bg-gray-800 py-2 rounded" {...props} />,
    hr: ({node, ...props}) => <hr className="border-gray-600 my-4" {...props} />
  }

  const compareContracts = async () => {
    if (!fileName1 || !fileName2) return
    
    setIsLoading(true)
    setSummary("")

    try {
      const formData = new FormData()
      formData.append("pdf1", file1)
      formData.append("pdf2", file2)
      
      const res = await fetch("http://localhost:8000/contract-comparison", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to compare contracts")

      const data = await res.json()
      console.log("Raw API response:", data)
      
      // Format the response as markdown
      const formattedSummary = formatComparisonAsMarkdown(data.differences)
      console.log("Formatted markdown:", formattedSummary)
      setSummary(formattedSummary)
      
    } catch (error) {
      console.error("Comparison error:", error)
      setSummary("## Error\n\nSorry, there was an error comparing the contracts. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const FileUploadSection = ({ 
    title, 
    fileInputRef, 
    onPickFile, 
    onDragOver, 
    onDragLeave, 
    onDrop, 
    dragActive, 
    onInputChange, 
    fileName, 
    onRemoveFile,
    pdfUrl 
  }) => (
    <section className="flex flex-col">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-300">You can upload Scannable or readable PDF Files.</p>

      {/* Drag and drop area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`mt-4 inline-flex max-w-full flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-3 text-left w-full ${
          dragActive ? "border-red-500" : "border-red-400"
        }`}
      >
        <button
          type="button"
          onClick={onPickFile}
          className="w-full text-left text-base cursor-pointer text-white"
        >
          <span className="font-medium">Drag and drop</span>{" "}
          <span className="text-neutral-300">or</span>{" "}
          <span className="underline">choose a file</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={onInputChange}
          className="hidden"
        />

        {fileName && (
          <div className="mt-3 w-full p-3 bg-[#303030] rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">File Uploaded</p>
                  <p className="text-xs text-gray-300 truncate max-w-[200px]">{fileName}</p>
                </div>
              </div>
              <button
                onClick={onRemoveFile}
                className="text-gray-400 hover:text-red-500 text-sm transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )

  return (
    <main className="min-h-screen text-white p-4 md:p-6 relative">
      <img
        src="/bgLeft.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 right-0"
      />
      <img
        src="/bgRight.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 left-0"
      />

      {/* Header */}
      <div className="relative rounded-md bg-[#d64557] flex items-center gap-3">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            maskImage: "linear-gradient(to left, transparent, black 20%, black 80%, transparent)",
          }}
        />
        <span className="cursor-pointer ml-2" onClick={goBack}><ArrowLeft/></span>
        <h1 className="relative py-4 text-2xl font-semibold">Contract Comparison</h1>
      </div>

      {/* Upload Sections */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadSection
          title="Upload your Original File"
          fileInputRef={fileInputRef1}
          onPickFile={pickFile1}
          onDragOver={onDragOver1}
          onDragLeave={onDragLeave1}
          onDrop={onDrop1}
          dragActive={dragActive1}
          onInputChange={onInputChange1}
          fileName={fileName1}
          onRemoveFile={removeFile1}
          pdfUrl={pdfUrl1}
        />

        <FileUploadSection
          title="Upload your New File"
          fileInputRef={fileInputRef2}
          onPickFile={pickFile2}
          onDragOver={onDragOver2}
          onDragLeave={onDragLeave2}
          onDrop={onDrop2}
          dragActive={dragActive2}
          onInputChange={onInputChange2}
          fileName={fileName2}
          onRemoveFile={removeFile2}
          pdfUrl={pdfUrl2}
        />
      </div>

      {/* Comparison Button */}
      {(fileName1 && fileName2) && (
        <div className="mt-6 flex">
          <button 
            onClick={compareContracts}
            disabled={isLoading}
            className={`bg-red-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors cursor-pointer ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
            }`}
          >
            {isLoading ? 'Comparing...' : 'Compare Contracts'}
          </button>
        </div>
      )}

      {/* Preview and Summary Section - Always visible with gray background */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tab-based PDF Preview - 50% width */}
        <div className="bg-[#404040] border border-[#2f333a] rounded-lg p-4 h-[500px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4">PDF Preview</h2>
          
          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('original')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'original' 
                  ? 'bg-[#D93954] text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Original File
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'new' 
                  ? 'bg-[#D93954] text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              New File
            </button>
          </div>

          {/* PDF Preview Area */}
          <div className="flex-1 rounded-md bg-black p-2">
            {activeTab === 'original' && pdfUrl1 ? (
              <iframe
                title="Original PDF Preview"
                src={`${pdfUrl1}#view=FitH`}
                className="h-full w-full rounded"
              />
            ) : activeTab === 'new' && pdfUrl2 ? (
              <iframe
                title="New PDF Preview"
                src={`${pdfUrl2}#view=FitH`}
                className="h-full w-full rounded"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded bg-black text-neutral-400">
                {activeTab === 'original' 
                  ? 'No original file uploaded' 
                  : 'No new file uploaded'
                }
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary Box - 50% width */}
        <div className="bg-[#404040] border border-[#2f333a] rounded-lg p-4 h-[500px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Comparison Summary</h2>
          
          <div className="flex-1 rounded-md bg-black p-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-300 text-sm">Comparing contracts...</p>
                </div>
              </div>
            ) : summary ? (
              <div className="text-gray-300 text-sm leading-relaxed">
                <ReactMarkdown components={markdownComponents}>
                  {summary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm text-center">
                  {fileName1 && fileName2 
                    ? "Click 'Compare Contracts' to see the comparison summary" 
                    : "Upload both files and click 'Compare Contracts' to see the comparison summary"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default ContractComparison