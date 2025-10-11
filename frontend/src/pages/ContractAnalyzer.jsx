import { ArrowLeft } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useEffect } from "react"
import ReactMarkdown from 'react-markdown'

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

function UploadArea({ onFileUpload, uploadedFile }) {
  const [fileName, setFileName] = useState("")
  const inputRef = useRef(null)
  const [question, setQuestion] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [answer, setAnswer] = useState("")
  const [conversation, setConversation] = useState([])

  const onSend = async () => {
    if (!question.trim() || !uploadedFile) return
    
    setIsAsking(true)
    
    // Add user question to conversation
    const userMessage = { type: 'user', content: question }
    setConversation(prev => [...prev, userMessage])
    
    const currentQuestion = question
    setQuestion("")

    try {
      const formData = new FormData()
      formData.append("pdf", uploadedFile)
      formData.append("question", currentQuestion)

      const res = await fetch("http://localhost:8000/contract-analyzer-question", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to get answer")

      const data = await res.json()
      console.log(data.answer)
      
      // Add AI answer to conversation
      const aiMessage = { type: 'ai', content: data.answer }
      setConversation(prev => [...prev, aiMessage])
      setAnswer(data.answer)
      
    } catch (error) {
      console.log(error)
      const errorMessage = { type: 'ai', content: "Sorry, I encountered an error while processing your question." }
      setConversation(prev => [...prev, errorMessage])
      setAnswer("Sorry, I encountered an error while processing your question.")
    } finally {
      setIsAsking(false)
    }
  }

  const onChoose = () => inputRef.current?.click()

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) {
      setFileName(f.name)
      onFileUpload?.(f)
      setConversation([]) // Clear conversation when new file is uploaded
      setAnswer("")
    }
  }, [onFileUpload])

  const onChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFileName(f.name)
      onFileUpload?.(f)
      setConversation([]) // Clear conversation when new file is uploaded
      setAnswer("")
    }
  }

  const removeFile = () => {
    setFileName("")
    onFileUpload?.(null)
    setConversation([]) // Clear conversation when file is removed
    setAnswer("")
  }

  // Custom components for ReactMarkdown to style the markdown content
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-md font-bold text-white mt-3 mb-2" {...props} />,
    h4: ({node, ...props}) => <h4 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
    p: ({node, ...props}) => <p className="text-gray-300 mb-2 leading-relaxed" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1" {...props} />,
    li: ({node, ...props}) => <li className="ml-4" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
    em: ({node, ...props}) => <em className="italic" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500 pl-4 my-2 text-gray-400 italic" {...props} />,
    code: ({node, inline, ...props}) => 
      inline ? 
        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props} /> :
        <code className="block bg-gray-800 p-3 rounded my-2 text-sm font-mono overflow-x-auto" {...props} />,
    table: ({node, ...props}) => <table className="w-full border-collapse border border-gray-600 my-2" {...props} />,
    th: ({node, ...props}) => <th className="border border-gray-600 px-3 py-2 bg-gray-800 text-white font-bold" {...props} />,
    td: ({node, ...props}) => <td className="border border-gray-600 px-3 py-2 text-gray-300" {...props} />,
    a: ({node, ...props}) => <a className="text-red-400 hover:text-red-300 underline" {...props} />,
    hr: ({node, ...props}) => <hr className="border-gray-600 my-4" {...props} />
  }

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="space-y-3">
      <div className="border-2 border-dashed border-red-400 rounded-lg p-4 md:p-5">
        <div className="text-base text-white">
          <span>Drag and drop or </span>
          <button
            type="button"
            onClick={onChoose}
            className="underline decoration-1 underline-offset-2 hover:opacity-90 text-white cursor-pointer"
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
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              disabled={isAsking || !uploadedFile}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={isAsking || !uploadedFile || !question.trim()}
              className={`h-10 w-10 flex items-center justify-center text-[#e9eefc] rounded-lg hover:opacity-90 ${
                isAsking || !uploadedFile || !question.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 cursor-pointer'
              }`}
              aria-label="Send"
              title="Send"
            >
              <PaperPlaneIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 md:h-[390px] rounded-md bg-black p-4 overflow-y-auto">
            {isAsking ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-300 text-sm">Finding answer...</p>
                </div>
              </div>
            ) : conversation.length > 0 ? (
              <div className="space-y-4">
                {conversation.map((msg, index) => (
                  <div key={index} className={`${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.type === 'user' ? (
                      <div className="inline-block bg-red-500 text-white px-3 py-2 rounded-lg max-w-[80%]">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="text-gray-300 text-sm leading-relaxed">
                        <ReactMarkdown components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm text-center">
                  {uploadedFile 
                    ? "Ask a question about your contract to get started" 
                    : "Upload a PDF file to start asking questions"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryPanel({ hasFile, isGenerating, summary }) {
  // Custom components for ReactMarkdown to style the markdown content
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-md font-bold text-white mt-3 mb-2" {...props} />,
    h4: ({node, ...props}) => <h4 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
    p: ({node, ...props}) => <p className="text-gray-300 mb-2 leading-relaxed" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1" {...props} />,
    li: ({node, ...props}) => <li className="ml-4" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
    em: ({node, ...props}) => <em className="italic" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500 pl-4 my-2 text-gray-400 italic" {...props} />,
    code: ({node, inline, ...props}) => 
      inline ? 
        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props} /> :
        <code className="block bg-gray-800 p-3 rounded my-2 text-sm font-mono overflow-x-auto" {...props} />,
    table: ({node, ...props}) => <table className="w-full border-collapse border border-gray-600 my-2" {...props} />,
    th: ({node, ...props}) => <th className="border border-gray-600 px-3 py-2 bg-gray-800 text-white font-bold" {...props} />,
    td: ({node, ...props}) => <td className="border border-gray-600 px-3 py-2 text-gray-300" {...props} />,
    a: ({node, ...props}) => <a className="text-red-400 hover:text-red-300 underline" {...props} />,
    hr: ({node, ...props}) => <hr className="border-gray-600 my-4" {...props} />
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
                  <div className="markdown-content">
                    <ReactMarkdown components={markdownComponents}>
                      {summary}
                    </ReactMarkdown>
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

function PDFPreview({ uploadedFile, fileName }) {
  const [pdfUrl, setPdfUrl] = useState("")

  useEffect(() => {
    if (uploadedFile) {
      // Create object URL for the uploaded PDF file
      const url = URL.createObjectURL(uploadedFile)
      setPdfUrl(url)
      
      // Clean up object URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPdfUrl("")
    }
  }, [uploadedFile])

  return (
    <div className="space-y-3">
  <div>
    <h2 className="text-lg font-semibold text-white mb-2">PDF Preview</h2>
    <div className="rounded-lg bg-black p-2 h-[200px] md:h-[340px]">
      {pdfUrl ? (
        <iframe
          title="PDF Preview"
          src={`${pdfUrl}#view=FitH`}
          className="h-full w-full rounded"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded bg-black text-neutral-400 text-sm text-center px-2">
          {uploadedFile
            ? "Loading PDF preview..."
            : "PDF preview will appear here after upload"}
        </div>
      )}
    </div>
  </div>
</div>

  )
}

export default function ContractAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState("")

  const backButton = () => {
    window.history.back()
  }

  const handleFileUpload = (file) => {
    setUploadedFile(file)
    setFileName(file?.name || "")
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
        
        setSummary(data.summary)
        
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
          <UploadArea onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
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
          
          {/* PDF Preview Section */}
          <PDFPreview uploadedFile={uploadedFile} fileName={fileName} />
        </div>
      </section>
    </main>
  )
}