import React, { useState, useEffect, useRef } from 'react';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, SendHorizontal, Mic, MicOff, Mail, Phone, CheckCircle, XCircle, Clock, CheckSquare } from 'lucide-react';
import axios from "axios";

const OrderAgent = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderMessage, setOrderMessage] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [parsedOrder, setParsedOrder] = useState(null);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchInventory();
    initializeSpeechRecognition();
    fetchPendingOrders();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:8000/get-inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/pending-order');
      if (response.data && response.data.orders) {
        setPendingOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setOrderMessage(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Calculate total cost from parsed order
  const calculateTotalCost = (order) => {
    if (!order || !Array.isArray(order)) return 0;
    return order.reduce((total, item) => {
      const quantity = item.quantity || item.Quantity || 0;
      const price = item.price || item.Price || 0;
      return total + (quantity * price);
    }, 0);
  };

  const handleProcessOrder = async () => {
    if (!orderMessage.trim()) {
      alert('Please enter your order details.');
      return;
    }

    if (!customerEmail.trim()) {
      alert('Please enter your email address.');
      return;
    }

    if (!validateEmail(customerEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Please enter your phone number.');
      return;
    }

    if (!validatePhone(customerPhone)) {
      alert('Please enter a valid phone number.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await axios.post('http://localhost:8000/bulk-order', {
        customerEmail,
        customerPhone,
        orderMessage
      });

      console.log(response.data);
      
      // Set the parsed order data from backend response
      if (response.data.parsedOrder) {
        setParsedOrder(response.data.parsedOrder);
        setShowOrderConfirmation(true);
      } else {
        alert('Items Identified Successfully. Please Confirm to Process your Order.');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!parsedOrder) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post('http://localhost:8000/confirm-order', {
        customerEmail,
        customerPhone,
        parsedOrder
      });
      console.log(response.data);
      alert('Order confirmed and processed successfully!');

      // Fetch updated pending orders
      await fetchPendingOrders();
      
      // Reset states
      setShowOrderConfirmation(false);
      setParsedOrder(null);
      setOrderMessage('');
      setCustomerEmail('');
      setCustomerPhone('');
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Error confirming order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = () => {
    setShowOrderConfirmation(false);
    setParsedOrder(null);
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcessOrder();
    }
  };

  const getStockStatus = (stock) => {
    if (stock > 50) return { color: 'text-green-400', bg: 'bg-green-900', label: 'High' };
    if (stock > 20) return { color: 'text-yellow-400', bg: 'bg-yellow-900', label: 'Medium' };
    return { color: 'text-red-400', bg: 'bg-red-900', label: 'Low' };
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Spicy': 'border-l-red-500 bg-red-950/20',
      'Creamy': 'border-l-green-500 bg-green-950/20',
      'Tangy': 'border-l-orange-500 bg-orange-950/20',
      'Cheesy': 'border-l-yellow-500 bg-yellow-950/20',
      'Healthy': 'border-l-emerald-500 bg-emerald-950/20',
      'Classic': 'border-l-gray-500 bg-gray-950/20'
    };
    return colors[category] || 'border-l-blue-500 bg-blue-950/20';
  };

  const getColorClass = (color) => {
    const colors = {
      'Red': 'bg-red-500',
      'Blue': 'bg-blue-500',
      'Green': 'bg-green-500',
      'Yellow': 'bg-yellow-500',
      'Purple': 'bg-purple-500',
      'Orange': 'bg-orange-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const stats = {
    totalProducts: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + item.Stock, 0),
    lowStock: inventory.filter(item => item.Stock <= 20).length,
    averagePrice: inventory.reduce((sum, item) => sum + item.Price, 0) / inventory.length,
    pendingOrders: pendingOrders.length
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <img src="/bgLeft.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 right-0" />
        <img src="/bgRight.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 left-0" />
        
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D93954]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <img src="/bgLeft.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 right-0" />
      <img src="/bgRight.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 left-0" />

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && parsedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#303030] border border-gray-600 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Confirm Your Order</h2>
              <button
                onClick={handleCancelOrder}
                className="text-red-500 hover:text-red-600 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-4">
                {parsedOrder.map((item, index) => (
                  <div key={index} className="bg-[#252525] border border-gray-600 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-white font-semibold">{item.English_Name}</h4>
                        <p className="text-gray-400 text-sm">{item.Hindi_Name}</p>
                        <p className="text-gray-400 text-sm">Product ID: {item.product_id}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400">Quantity: <span className="text-white">{item.quantity}</span></p>
                          <p className="text-gray-400">Pack Size: <span className="text-white">{item.Pack_Size}</span></p>
                          <p className="text-gray-400">Price: <span className="text-white">₹{item.price}</span></p>
                          <p className="text-gray-400">Item Total: <span className="text-white font-semibold">₹{(item.quantity * item.price).toFixed(2)}</span></p>
                        </div>
                      </div>
                    </div>
                    {item.confidence && (
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.confidence === 'high' 
                            ? 'bg-green-900 text-green-400' 
                            : item.confidence === 'medium'
                            ? 'bg-yellow-900 text-yellow-400'
                            : 'bg-red-900 text-red-400'
                        }`}>
                          Confidence: {item.confidence}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Cost Summary */}
              <div className="mt-6 bg-[#252525] border border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-semibold text-lg">Order Total</h4>
                    <p className="text-gray-400 text-sm">{parsedOrder.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">₹{calculateTotalCost(parsedOrder).toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">Total Amount</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelOrder}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-[#D93954] hover:bg-[#d93954d4] disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm & Process Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders Modal */}
      {showPendingOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#303030] border border-gray-600 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Pending Orders</h2>
              <button
                onClick={() => setShowPendingOrders(false)}
                className="text-red-500 hover:text-red-600 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {pendingOrders.length > 0 ? (
                pendingOrders.map((order, index) => (
                  <div key={index} className="bg-[#252525] border border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-semibold text-lg">{order.English_Name}</h4>
                        <p className="text-gray-400 text-sm">Product ID: {order.Product_ID}</p>
                        <p className="text-gray-400 text-sm">Pack Size: {order.Pack_Size}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getColorClass(order.Color)}`}></div>
                        <span className="text-gray-400 text-sm">{order.Color}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Quantity</p>
                        <p className="text-white font-semibold text-xl">{order.Quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Price</p>
                        <p className="text-white font-semibold text-xl">₹{order.Price}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Item Total</p>
                        <p className="text-white font-semibold text-xl">₹{(order.Quantity * order.Price).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        className="flex items-center gap-2 bg-[#D93954] hover:bg-[#d93954df] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Mark as Received
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Pending Orders</h3>
                  <p className="text-gray-400">All orders have been processed and received.</p>
                </div>
              )}
            </div>

            {pendingOrders.length > 0 && (
              <div className="mt-6 bg-[#252525] border border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-semibold text-lg">Total Pending Orders</h4>
                    <p className="text-gray-400 text-sm">{pendingOrders.length} items pending</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">₹{calculateTotalCost(pendingOrders).toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">Total Pending Amount</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Header / Hero Section */}
      <header className="text-center mb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Smart Ordering Agent
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your Conversational Co-Pilot for Inventory Management.
          </p>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#303030] rounded-xl p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Products</p>
              <p className="text-xl font-bold text-white mt-1">{stats.totalProducts}</p>
            </div>
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-xl p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Stock</p>
              <p className="text-xl font-bold text-white mt-1">{stats.totalStock.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-xl p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Low Stock</p>
              <p className="text-xl font-bold text-white mt-1">{stats.lowStock}</p>
            </div>
            <div className="w-10 h-10 bg-red-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-xl p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Avg Price</p>
              <p className="text-xl font-bold text-white mt-1">₹{stats.averagePrice.toFixed(0)}</p>
            </div>
            <div className="w-10 h-10 bg-[#D93954] rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-xl p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Pending Orders</p>
              <p className="text-xl font-bold text-white mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-900 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowPendingOrders(true)}
          className="flex items-center gap-2 bg-[#D93954] hover:bg-[#d93954d7] cursor-pointer text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <Clock className="w-5 h-5" />
          View Pending Orders ({pendingOrders.length})
        </button>
      </div>

      {/* Main Content Grid - Left Side Order Input, Right Side Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Enhanced Order Input Section */}
        <div className="lg:col-span-2 bg-[#303030] border border-gray-600 rounded-xl p-6">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Place Your Order</h2>
              <p className="text-gray-400">
                Describe your order or use voice input for faster ordering.
              </p>
            </div>

            {/* Enhanced Input Area */}
            <div className="flex-1 flex flex-col">
              {/* Order Description Input */}
              <div className="mb-6">
                <label htmlFor="orderMessage" className="block text-sm font-medium text-gray-300 mb-2">
                  Order Description *
                </label>
                <div className="relative">
                  <textarea
                    id="orderMessage"
                    value={orderMessage}
                    onChange={(e) => setOrderMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Example: I need to order 50 units of Spicy chips and 30 units of Creamy cookies. What's the availability and total cost?"
                    className="w-full h-32 bg-[#252525] border border-gray-600 rounded-xl px-4 py-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#D93954] transition-colors text-lg leading-relaxed"
                    disabled={isProcessing}
                  />
                  
                  {/* Voice Input Button */}
                  <button
                    onClick={toggleSpeechRecognition}
                    disabled={isProcessing}
                    className={`absolute bottom-4 right-4 p-3 rounded-full transition-all duration-200 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-[#D93954] hover:bg-[#c5324a]'
                    } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-white" />
                    )}
                  </button>
                  
                  {/* Voice Input Status */}
                  {isListening && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Listening...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="customerEmail"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-[#252525] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D93954] transition-colors"
                      disabled={isProcessing}
                    />
                  </div>
                  {customerEmail && !validateEmail(customerEmail) && (
                    <p className="text-red-400 text-xs mt-1">Please enter a valid email address</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full bg-[#252525] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D93954] transition-colors"
                      disabled={isProcessing}
                    />
                  </div>
                  {customerPhone && !validatePhone(customerPhone) && (
                    <p className="text-red-400 text-xs mt-1">Please enter a valid phone number</p>
                  )}
                </div>
              </div>

              {/* Quick Order Suggestions */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Quick order examples:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "teen packet Lal chips do packet Neele chips aur ek packet Hara chips aur Char Lal toffee chahie",
                    "10 packet Neela 10 packet Hara 10 packet Lal chips chahie aur saath mai 5 packet Laal waali toffee bhi dedo",
                    "do Peele wale chips aur Panch packet Meethi toffee",
                    "Sare items do do packet kar do"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setOrderMessage(suggestion)}
                      className="text-left text-sm bg-[#252525] hover:bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-3 text-gray-300 transition-all duration-200 hover:border-[#D93954] hover:scale-[1.02]"
                      disabled={isProcessing}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {orderMessage.length > 0 && (
                    <span>{orderMessage.length} characters</span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setOrderMessage('');
                      setCustomerEmail('');
                      setCustomerPhone('');
                    }}
                    disabled={(!orderMessage.trim() && !customerEmail.trim() && !customerPhone.trim()) || isProcessing}
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                  
                  <button
                    onClick={handleProcessOrder}
                    disabled={!orderMessage.trim() || !customerEmail.trim() || !customerPhone.trim() || isProcessing || !validateEmail(customerEmail) || !validatePhone(customerPhone)}
                    className="flex items-center gap-3 bg-[#D93954] hover:bg-[#c5324a] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="w-5 h-5" />
                        Process Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Compact Inventory Section */}
        <div className="overflow-hidden">
          <div className="p-4 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Current Inventory</h2>
                <p className="text-gray-400 text-sm">{inventory.length} products</p>
              </div>
              <div className="text-xs text-gray-400">
                Scroll to view
              </div>
            </div>
          </div>
          
          {/* Compact Scrollable Products Container */}
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-3">
              {inventory.map((product) => {
                const stockStatus = getStockStatus(product.Stock);
                const categoryColor = getCategoryColor(product.Category);
                
                return (
                  <div
                    key={product.Product_ID}
                    className={`bg-[#252525] rounded-lg p-4 border border-gray-600 cursor-pointer transition-all duration-200 hover:border-[#D93954] ${categoryColor} border-l-4`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{product.English_Name}</h3>
                        <p className="text-gray-400 text-xs">{product.Product_ID}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color} flex-shrink-0 ml-2`}>
                        {stockStatus.label}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Price</p>
                          <p className="text-white font-semibold">₹{product.Price}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Stock</p>
                          <p className="text-white font-semibold">{product.Stock}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Category</p>
                          <p className="text-white font-semibold text-xs">{product.Category}</p>
                        </div>
                      </div>
                      
                      <div className={`w-2 h-2 rounded-full ${stockStatus.bg.replace('900', '500')} flex-shrink-0`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

export default OrderAgent;