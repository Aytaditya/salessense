import { useRef, useState, useCallback, useEffect } from "react"
import { ArrowLeft, Square } from "lucide-react"

export default function ContractExtraction() {
  const fileInputRef = useRef(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [fileName, setFileName] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [insights, setInsights] = useState(null)
  const [selectedField, setSelectedField] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const defaultFields = [
    "Entity Name",
    "Client Name", 
    "Start Date",
    "End Date",
    "Payment Method",
    "Payment_Amount",
    "Duration of Engagement",
    "Payment Terms",
    "Scope of Work",
  ]

  const pickFile = () => fileInputRef.current?.click()

  const handleFiles = useCallback((files) => {
    const file = files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.")
      return
    }
    const url = URL.createObjectURL(file)
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setFileName(file.name)
    
    // Extract insights when file is uploaded
    extractInsights(file)
  }, [])

  const extractInsights = async (file) => {
    setIsLoading(true)
    setSelectedField(null)
    
    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const res = await fetch("http://localhost:8000/contract-extraction", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to extract insights")

      const data = await res.json()
      console.log("Extraction response:", data)
      setInsights(data.insights || data)
      
    } catch (err) {
      console.error("Error extracting insights:", err)
      alert("Failed to extract insights from the contract")
    } finally {
      setIsLoading(false)
    }
  }

  const onInputChange = (e) => handleFiles(e.target.files)

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dt = e.dataTransfer
    if (dt?.files?.length) handleFiles(dt.files)
  }

  const removeFile = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setFileName("")
    setInsights(null)
    setSelectedField(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getButtonColor = (field) => {
    if (!insights) return "bg-gray-700 hover:bg-gray-600" // Black/Gray before upload
    
    const value = insights[field]
    if (!value || value === "Not Present") return "bg-red-600 hover:bg-red-700"
    if (value.includes("Present with Difference")) return "bg-yellow-600 hover:bg-yellow-700"
    return "bg-green-600 hover:bg-green-700"
  }

  const getButtonText = (field) => {
    if (!insights) return "Not Extracted" // Before uploading
    
    const value = insights[field]
    if (!value) return "Not Extracted"
    if (value === "Not Present") return "Not Present"
    if (value.includes("Present with Difference")) return "Present with Difference"
    return "Present"
  }

  const getFieldValue = (field) => {
    if (!insights) return "Upload PDF to extract this field" // Before upload
    return insights[field] || "Not extracted"
  }

  const formatFieldName = (fieldName) => {
    return fieldName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
  }

  const goBack = () => {
    window.history.back()
  }

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
        <h1 className="relative py-4 text-2xl font-semibold">Contract Extraction</h1>
      </div>

      {/* Content */}
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {/* Left: Uploader + Preview */}
        <section className="flex flex-col">
          <h2 className="text-lg font-semibold">Upload your file</h2>
          <p className="mt-1 text-sm text-neutral-300">You can upload Scannable or readable PDF Files.</p>

          {/* Drag and drop small box */}
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
              onClick={pickFile}
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
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-500 text-sm transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PDF Preview Area */}
          <div className="mt-4 flex-1 rounded-md bg-black p-2">
            {pdfUrl ? (
              <iframe
                title="PDF Preview"
                src={`${pdfUrl}#view=FitH`}
                className="h-[340px] w-full rounded"
              />
            ) : (
              <div className="flex h-[340px] w-full items-center justify-center rounded bg-black text-neutral-400">
                PDF preview will appear here after upload
              </div>
            )}
          </div>
        </section>

        {/* Right: Insights panel */}
        <section className="flex flex-col">
          <h2 className="text-lg font-semibold">Insights</h2>

          <div className="mt-2 rounded-md bg-[#303030] p-4 h-[220px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-300 text-sm">Extracting insights...</p>
                </div>
              </div>
            ) : (
              <>
              <div className="space-y-2">
                {defaultFields.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => setSelectedField({ field, value: getFieldValue(field) })}
                    className={` rounded-full px-4 py-2 mx-2 my-1 text-center text-sm font-semibold text-white cursor-pointer transition-colors ${getButtonColor(field)}`}
                  >
                    {formatFieldName(field)}
                  </button>
                ))}
              </div>
              <div className="flex mt-7">
                <span className="flex gap-1 mr-3">
                    <Square fill="green" />
                    <p>Present</p>
                </span>
                <span className="flex gap-1 mr-3">
                    <Square fill="Red" />
                    <p>Not Present</p>
                </span>
                <span className="flex gap-1 mr-3">
                    <Square fill="yellow" />
                    <p>Present with Difference</p>
                </span>
              </div>
              </>
            )}
          </div>

          {/* Field Details Panel */}
          <div className="mt-4 rounded-md bg-[#303030] p-4 h-[330px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">Field Details</h3>
            {selectedField ? (
              <div className="space-y-3 ">
                <div>
                  <h4 className="font-medium text-white mb-1">{formatFieldName(selectedField.field)}</h4>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedField.value}
                  </p>
                </div>
                {insights && (
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedField.value === "Not Present" ? "bg-red-600 text-white" :
                      selectedField.value.includes("Present with Difference") ? "bg-yellow-600 text-white" :
                      selectedField.value !== "Upload PDF to extract this field" && selectedField.value !== "Not extracted" ? "bg-green-600 text-white" :
                      "bg-gray-600 text-white"
                    }`}>
                      {getButtonText(selectedField.field)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm text-center">
                  Click on a field above to view its details
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}