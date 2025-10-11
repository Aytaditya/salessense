import { ArrowLeft } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"

function PaperPlaneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 3L9.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 3L14.5 21l-3.5-7.5L3.5 10 21 3z" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

function UploadHeader() {
  return (
    <div className="text-left">
      <h2 className="text-lg font-semibold text-white">Upload your file</h2>
      <p className="text-sm text-gray-300 mt-1">You can upload Scannable or readable PDF Files.</p>
    </div>
  )
}

function UploadArea({ onFileUpload }) {
  const [fileName, setFileName] = useState("")
  const inputRef = useRef(null)
  const [question, setQuestion] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const onSend = () => {
    if (!question.trim()) return
    console.log("[v0] Send question:", question)
    setQuestion("")
  }

  const onChoose = () => inputRef.current?.click()

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) {
      setFileName(f.name)
      onFileUpload?.(f)
    }
  }, [onFileUpload])

  const onChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFileName(f.name)
      onFileUpload?.(f)
    }
  }

  const removeFile = () => {
    setFileName("")
    onFileUpload?.(null)
  }

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="space-y-3">
      <div className="border-2 border-dashed border-red-400 rounded-lg p-4 md:p-5">
        <div className="text-base text-white">
          <span>Drag and drop or </span>
          <button
            type="button"
            onClick={onChoose}
            className="underline decoration-1 underline-offset-2 hover:opacity-90 text-white"
            aria-label="Choose a file"
          >
            choose a file
          </button>
        </div>
        <input ref={inputRef} type="file" accept="application/pdf" onChange={onChange} className="hidden" />
        
        {fileName && (
          <div className="mt-3 p-3 bg-[#303030] rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

      <div className="bg-[#404040] border border-[#2f333a] rounded-lg h-[420px] md:h-[520px] p-3 md:p-4 overflow-auto">
        <div className="rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 h-10 px-3 bg-[#303030] text-[#e9eefc] placeholder:text-[#d6def8] rounded-lg"
              placeholder="Enter your question.."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="button"
              onClick={onSend}
              className="h-10 w-10 flex items-center justify-center bg-red-500 cursor-pointer text-[#e9eefc] rounded-lg hover:opacity-90"
              aria-label="Send"
              title="Send"
            >
              <PaperPlaneIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 md:h-[390px] rounded-md bg-black" />
        </div>
      </div>
    </div>
  )
}

function SummaryPanel({ hasFile, isGenerating, summary }) {
  const [question, setQuestion] = useState("")

  const onSend = () => {
    if (!question.trim()) return
    console.log("[v0] Send question:", question)
    setQuestion("")
  }

  return (
    <div className="space-y-3">
      <div className="bg-[#404040] border border-[#2f333a] rounded-lg p-3 md:p-4 h-[200px] md:h-[300px] overflow-hidden">
        <div className="w-full h-full rounded-md bg-black overflow-y-auto p-4">
          {hasFile ? (
            isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-300 text-sm">Generating summary...</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-300 text-sm leading-relaxed">
                {summary ? (
                  <div>
                    <h3 className="text-white font-semibold mb-2">Contract Analysis Summary</h3>
                    <div className="whitespace-pre-wrap">{summary}</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm text-center">
                      No summary available. Please try uploading again.
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm text-center">
                Upload a PDF file to generate the analysis summary
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ContractAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState("")

  const backButton = () => {
    window.history.back()
  }

  const handleFileUpload = (file) => {
    setUploadedFile(file)
    setIsGenerating(false)
    setSummary("") // Clear previous summary when new file is uploaded
  }

  useEffect(() => {
    if (!uploadedFile) return

    const uploadAndAnalyze = async () => {
      setIsGenerating(true)

      try {
        const formData = new FormData()
        formData.append("pdf", uploadedFile)

        const res = await fetch("http://localhost:8000/contract-analyzer-summarization", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Failed to analyze contract")

        const data = await res.json()
        console.log("Backend response:", data)
        
        setSummary(data.summary )
        
      } catch (err) {
        console.error("Error uploading file:", err)
        setSummary("Error generating summary. Please try again.")
      } finally {
        setIsGenerating(false)
      }
    }

    uploadAndAnalyze()
  }, [uploadedFile])

  return (
    <main className="min-h-screen text-white p-3 md:p-4">
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

      <div className="bg-[#D93954] text-white rounded-lg px-4 py-3 md:px-6 md:py-4 mb-4 flex items-center gap-3">
        <span onClick={backButton} className="cursor-pointer"><ArrowLeft/></span>
        <h1 className="text-2xl font-bold">Contract Analyzer</h1>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-3">
          <UploadHeader />
          <UploadArea onFileUpload={handleFileUpload} />
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Summary</h2>
            <SummaryPanel 
              hasFile={!!uploadedFile} 
              isGenerating={isGenerating} 
              summary={summary} 
            />
          </div>
        </div>
      </section>
    </main>
  )
}