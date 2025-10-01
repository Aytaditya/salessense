import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react'
import axios from "axios";
import ReactMarkdown from 'react-markdown';

const TalkToData = ({ file }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);
    const messagesEndRef = useRef(null);
    const analysisRef = useRef(null);
    const recommendationsRef = useRef(null);

    const quickActions = [
        {
            id: 1,
            title: "Unique Customers",
            subtitle: "Total Unique Customers",
            message: "How many unique customers"
        },
        {
            id: 2,
            title: "Top 10 Products",
            subtitle: "Best Selling products",
            message: "What are the top 10 best-selling products by revenue?"
        },
        {
            id: 3,
            title: "Bandwidth Management",
            subtitle: "Modifying customer bandwidth",
            message: "Review and manage customer bandwidth allocations"
        },
        {
            id: 4,
            title: "Router Details",
            subtitle: "Check router versions",
            message: "Get detailed router information and versions"
        },
        {
            id: 5,
            title: "Top 5 Countries",
            subtitle: "Top Performing Countires",
            message: "Top 5 Countires by Highest Sales"
        }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const formatAnswerData = (answer) => {
        if (!answer || !Array.isArray(answer)) return 'No data available';
        
        if (answer.length === 1 && typeof answer[0] === 'object') {
            // Single object with multiple key-value pairs
            const data = answer[0];
            return Object.entries(data).map(([key, value]) => 
                `- **${key}**: ${typeof value === 'number' ? value.toLocaleString() : value}`
            ).join('\n');
        } else if (answer.length > 1) {
            // Multiple objects - show as table
            const headers = Object.keys(answer[0]);
            const headerRow = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |`;
            const dataRows = answer.map(row => 
                `| ${headers.map(header => 
                    typeof row[header] === 'number' ? row[header].toLocaleString() : row[header]
                ).join(' | ')} |`
            ).join('\n');
            return `${headerRow}\n${dataRows}`;
        } else {
            // Single value or array
            return JSON.stringify(answer, null, 2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading || !file) return;

        const userMessage = {
            id: Date.now(),
            content: inputMessage,
            sender: "user",
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', inputMessage);
            formData.append('file', file);

            const response = await axios.post(
                "http://localhost:8000/api/chat",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const result = response.data;
            console.log('API Response:', result);
            
            setLastResponse(result);

            // Create markdown formatted bot message
            const answerData = formatAnswerData(result.answer);
            const botContent = `## Summary\n${result.natural_language_summary}\n\n## Data Results\n\`\`\`json\n${JSON.stringify(result.answer, null, 2)}\n\`\`\``;

            const botMessage = {
                id: Date.now() + 1,
                content: botContent,
                sender: "assistant",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("API Error:", error);
            const errorMessage = {
                id: Date.now() + 1,
                content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                sender: "assistant",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action) => {
        setInputMessage(action.message);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const lastMessage = messages.findLast(msg => msg.sender === "assistant");
    const lastUserMessage = messages.findLast(msg => msg.sender === "user");

    const hasConversation = messages.length > 0;

    return (
        <div className="flex flex-col h-full">
            {/* Main Chat Area */}
            <div className={`grid ${hasConversation ? 'grid-cols-8 gap-6' : 'grid-cols-1'} items-center mb-6`}>

                {/* Left Side - Chat Display */}
                <div className={hasConversation ? "col-span-5" : "col-span-1"}>
                    <div className="flex flex-col w-full h-[64vh] px-8 pt-8 pb-2">
                        {messages.length === 0 ? (
                            // Welcome View
                            <div className="flex flex-row gap-6 items-center">
                                <div className="w-[82px] h-[82px]">
                                    <div className="w-20 h-20 bg-[#D93954] rounded-full flex items-center justify-center">
                                        <span className="text-white text-lg font-bold">CT</span>
                                    </div>
                                </div>
                                <div className="text-xl font-light">
                                    <span className="font-bold text-2xl text-[#D93954]">
                                        Hello,
                                    </span>
                                    <br />
                                    <span className="text-gray-300">I'm your</span>
                                    <span className="text-gray-300 font-semibold"> Cortex Assistant</span>
                                    <br />
                                    <span className="text-gray-300">
                                        I can help you analyze your data and generate insights.
                                    </span>
                                    {!file && (
                                        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                                            <p className="text-yellow-200 text-sm">
                                                Please upload a file first to start analyzing your data.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Chat View
                            <>
                                {/* User Message */}
                                <div className="flex ml-auto border-b border-[#3E3E3E] w-full justify-end pb-8">
                                    <div className="flex flex-row gap-4 items-center">
                                        <div className="text-gray-300 max-w-2xl">
                                            <span className="text-xl font-light break-words whitespace-pre-wrap">
                                                {lastUserMessage?.content}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-8 h-8 rounded-full p-4 text-white bg-[#D93954] flex items-center justify-center text-sm font-bold">
                                                    AA
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bot Response */}
                                <div className="flex flex-row gap-6 items-top pt-8 flex-1 min-h-0">
                                    <div className="w-[40px] h-[40px] flex-shrink-0">
                                        <div className="w-10 h-10 bg-[#D93954] rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">CT</span>
                                        </div>
                                    </div>

                                    <div className="text-xl font-light flex-1 min-h-0 flex flex-col">
                                        <div className="overflow-y-auto flex-1 custom-scrollbar pb-4">
                                            {isLoading ? (
                                                // Loading State for new response
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <div className="w-6 h-6 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin"></div>
                                                    Processing your query...
                                                </div>
                                            ) : lastMessage?.content ? (
                                                // Bot Response with Markdown
                                                <div className="text-gray-300 text-lg leading-relaxed">
                                                    <ReactMarkdown
                                                        components={{
                                                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4" {...props} />,
                                                            h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-white mb-3 mt-4" {...props} />,
                                                            h3: ({node, ...props}) => <h3 className="text-lg font-medium text-white mb-2 mt-3" {...props} />,
                                                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                                                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                                                            li: ({node, ...props}) => <li className="ml-4" {...props} />,
                                                            strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                                            code: ({node, inline, ...props}) => 
                                                                inline ? 
                                                                <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} /> :
                                                                <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto my-3 text-sm" {...props} />,
                                                            table: ({node, ...props}) => <table className="w-full border-collapse border border-gray-600 my-3" {...props} />,
                                                            th: ({node, ...props}) => <th className="border border-gray-600 px-3 py-2 bg-gray-800 text-left font-semibold" {...props} />,
                                                            td: ({node, ...props}) => <td className="border border-gray-600 px-3 py-2" {...props} />,
                                                        }}
                                                    >
                                                        {lastMessage.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                // Default state when no conversation
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    How can I help you with your data analysis today?
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side - Analysis Panel (Only shows after conversation starts) */}
                {hasConversation && (
                    <div className="col-span-3 flex flex-col gap-2 h-[64vh] w-full rounded-lg bg-[#303030] border border-gray-600">
                        <div className="flex flex-col w-full h-full min-h-0">
                            {/* Interpretation Panel */}
                            <div className="flex h-[72px] justify-center items-center border-b border-[#3E3E3E] flex-shrink-0">
                                <div className="my-6 font-bold text-gray-200">INTERPRETATION</div>
                            </div>

                            {/* Analysis Section */}
                            <div className="flex flex-col flex-1 min-h-0 m-3 gap-4">
                                <div className="flex flex-1 flex-col rounded-xl p-4 bg-[#252525] min-h-0">
                                    <div className="text-[#D93954] font-semibold mb-3 flex-shrink-0">ANALYSIS</div>
                                    <div
                                        ref={analysisRef}
                                        className="flex-1 overflow-y-auto custom-scrollbar font-light min-h-0"
                                    >
                                        {isLoading ? (
                                            // Loading state for analysis
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <div className="w-8 h-8 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin mb-3"></div>
                                                <span className="text-sm">Analyzing your data...</span>
                                            </div>
                                        ) : lastResponse?.interpretation ? (
                                            // Analysis content from backend
                                            <div className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                <p className="mb-3">{lastResponse.interpretation}</p>
                                                {lastResponse.answer && (
                                                    <div className="mt-4">
                                                        <p className="font-semibold text-[#D93954] mb-2">Query Results:</p>
                                                        <pre className="text-xs bg-black p-3 rounded overflow-x-auto">
                                                            {JSON.stringify(lastResponse.answer, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Default state
                                            <div className="text-center text-gray-400 h-full flex items-center justify-center">
                                                <span className="text-sm">Analysis in progress...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SQL Query Section */}
                                <div className="flex flex-1 flex-col rounded-xl p-4 bg-[#252525] min-h-0">
                                    <div className="text-[#D93954] font-semibold mb-3 flex-shrink-0">SQL QUERY</div>
                                    <div
                                        ref={recommendationsRef}
                                        className="flex-1 overflow-y-auto custom-scrollbar font-light min-h-0"
                                    >
                                        {isLoading ? (
                                            // Loading state for SQL query
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <div className="w-8 h-8 border-2 border-[#4ECDC4] border-t-transparent rounded-full animate-spin mb-3"></div>
                                                <span className="text-sm">Generating SQL query...</span>
                                            </div>
                                        ) : lastResponse?.code_executed ? (
                                            // SQL query content from backend
                                            <div className="text-gray-300 text-sm leading-relaxed">
                                                <div className="bg-[#1a1a1a] p-3 rounded-lg border-l-4 border-[#4ECDC4]">
                                                    <strong className="text-[#4ECDC4]">Executed Query:</strong>
                                                    <pre className="mt-2 text-xs bg-black p-2 rounded overflow-x-auto">
                                                        {lastResponse.code_executed}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            // Default state
                                            <div className="text-center text-gray-400 h-full flex items-center justify-center">
                                                <span className="text-sm">SQL query will appear here...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions and Input */}
            <div className="flex w-full flex-col gap-2">
                {/* Quick Actions */}
                {messages.length === 0 && (
                    <div className="grid grid-cols-5 gap-4">
                        {quickActions.map((action) => (
                            <div
                                key={action.id}
                                onClick={() => handleQuickAction(action)}
                                className="flex flex-col gap-2 bg-[#252525] p-4 rounded-lg cursor-pointer hover:bg-[#303030] transition-colors border border-gray-600"
                            >
                                <div className="font-bold text-gray-200">{action.title}</div>
                                <div className="text-sm text-gray-400">
                                    {action.subtitle}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="flex w-full flex-row items-center gap-2 my-4">
                    <form
                        onSubmit={handleSubmit}
                        className="flex-1 w-full bg-[#252525] p-4 rounded-full border border-gray-600"
                    >
                        <div className="flex gap-2">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={file ? "Ask about your data analysis..." : "Please upload a file first..."}
                                className="flex-1 rounded-lg px-4 py-2 focus:outline-none disabled:opacity-50 bg-transparent text-white placeholder-gray-500 resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
                                disabled={isLoading || !file}
                                rows="1"
                                style={{
                                    minHeight: '40px',
                                    maxHeight: '120px',
                                }}
                            />
                            <button
                                className="cursor-pointer p-2 hover:opacity-80 transition-opacity disabled:opacity-50 flex-shrink-0"
                                type="submit"
                                disabled={isLoading || !inputMessage.trim() || !file}
                            >
                                <SendHorizontal className="text-red-500" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a1a1a;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #D93954;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #c5324a;
                }
            `}</style>
        </div>
    );
};

export default TalkToData;