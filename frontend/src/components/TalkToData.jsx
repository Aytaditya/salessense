import React, { useState, useRef, useEffect } from 'react';

const TalkToData = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const analysisRef = useRef(null);
    const recommendationsRef = useRef(null);

    const quickActions = [
        {
            id: 1,
            title: "Secure Connection",
            subtitle: "Check connection availability",
            message: "Check the current connection status and availability"
        },
        {
            id: 2,
            title: "Maintenance Impact",
            subtitle: "Check affected customers",
            message: "Analyze maintenance impact on customers"
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
            title: "Router Security",
            subtitle: "Check router security",
            message: "Analyze router security configurations"
        }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

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
            // Simulate API call - replace with your actual endpoint
            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: inputMessage,
                }),
            });

            if (!response.ok) throw new Error('API call failed');

            const result = await response.json();

            console.log(result)

            const botMessage = {
                id: Date.now() + 1,
                content: result.answer ,
                sender: "assistant",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("API Error:", error);
            const errorMessage = {
                id: Date.now() + 1,
                content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                sender: "assistant",
                timestamp: new Date()
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
                    <div className="flex flex-col w-full h-[64vh] r px-8 pt-8 pb-2">
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
                                            {lastMessage?.content ? (
                                                <div className="text-gray-300 text-lg leading-relaxed break-words whitespace-pre-wrap">
                                                    {lastMessage.content}
                                                </div>
                                            ) : isLoading ? (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <div className="w-6 h-6 border-2 border-[#D93954] border-t-transparent rounded-full animate-spin"></div>
                                                    Processing your query...
                                                </div>
                                            ) : (
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
                                        {lastMessage?.content ? (
                                            <div className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                <p className="mb-3">Based on your query, I've analyzed the dataset and found:</p>
                                                <ul className="space-y-2 ml-4">
                                                    <li>• Key patterns in the sales data including seasonal trends and customer behavior</li>
                                                    <li>• Revenue optimization opportunities across different product categories</li>
                                                    <li>• Customer segmentation insights revealing distinct purchasing patterns</li>
                                                    <li>• Inventory management recommendations based on demand forecasting</li>
                                                    <li>• Market basket analysis showing product affinities and cross-selling opportunities</li>
                                                    <li>• Geographic performance metrics across different regions and territories</li>
                                                    <li>• Customer lifetime value analysis for retention strategy development</li>
                                                    <li>• Pricing optimization suggestions based on competitive analysis</li>
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400 h-full flex items-center justify-center">
                                                <span className="text-sm">Analysis in progress...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recommendations Section */}
                                <div className="flex flex-1 flex-col rounded-xl p-4 bg-[#252525] min-h-0">
                                    <div className="text-[#D93954] font-semibold mb-3 flex-shrink-0">PANDAS QUERY</div>
                                    <div 
                                        ref={recommendationsRef}
                                        className="flex-1 overflow-y-auto custom-scrollbar font-light min-h-0"
                                    >
                                        {lastMessage?.content ? (
                                            <div className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                <ul className="space-y-3">
                                                    <li className="bg-[#1a1a1a] p-3 rounded-lg border-l-4 border-[#4ECDC4]">
                                                        <strong className="text-[#4ECDC4]">Inventory Optimization:</strong> Adjust stock levels for high-performing products and reduce slow-moving inventory by 15%
                                                    </li>
                                                    <li className="bg-[#1a1a1a] p-3 rounded-lg border-l-4 border-[#FFB600]">
                                                        <strong className="text-[#FFB600]">Customer Retention:</strong> Implement loyalty programs for top 20% customers showing 35% higher lifetime value
                                                    </li>
                                                    <li className="bg-[#1a1a1a] p-3 rounded-lg border-l-4 border-[#D93954]">
                                                        <strong className="text-[#D93954]">Pricing Strategy:</strong> Introduce dynamic pricing for seasonal products to maximize revenue during peak demand
                                                    </li>
                                                    <li className="bg-[#1a1a1a] p-3 rounded-lg border-l-4 border-[#96CEB4]">
                                                        <strong className="text-[#96CEB4]">Marketing Focus:</strong> Target cross-selling campaigns based on product affinity analysis results
                                                    </li>
                                                    <li className="bg-[#1a1a1a] p-3 rounded-lg border-l-4 border-[#45B7D1]">
                                                        <strong className="text-[#45B7D1]">Operational Efficiency:</strong> Streamline supply chain for top-performing regions to reduce delivery times by 20%
                                                    </li>
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400 h-full flex items-center justify-center">
                                                <span className="text-sm">Recommendations will appear here...</span>
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
                                placeholder="Ask about your data analysis..."
                                className="flex-1 rounded-lg px-4 py-2 focus:outline-none disabled:opacity-50 bg-transparent text-white placeholder-gray-500 resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
                                disabled={isLoading}
                                rows="1"
                                style={{
                                    minHeight: '40px',
                                    maxHeight: '120px',
                                }}
                            />
                            <button
                                className="cursor-pointer p-2 hover:opacity-80 transition-opacity disabled:opacity-50 flex-shrink-0"
                                type="submit"
                                disabled={isLoading || !inputMessage.trim()}
                            >
                                <svg
                                    className="w-6 h-6 text-[#D93954]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
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