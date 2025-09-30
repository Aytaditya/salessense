import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

const Dashboard = ({ data }) => {
  const [timeRange, setTimeRange] = useState('monthly');

  // Ensure data is always an array and has valid structure
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => 
      item && 
      typeof item === 'object' && 
      (item.Price !== undefined || item.Quantity !== undefined)
    );
  }, [data]);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!processedData || processedData.length === 0) return {};

    // Sales by Country
    const salesByCountry = processedData.reduce((acc, item) => {
      const country = item.Country || 'Unknown';
      const total = (item.Price || 0) * (item.Quantity || 0);
      acc[country] = (acc[country] || 0) + total;
      return acc;
    }, {});

    const countryData = Object.entries(salesByCountry)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Sales over time
    const salesOverTime = processedData.reduce((acc, item) => {
      if (!item.Date) return acc;
      
      let date;
      try {
        date = new Date(item.Date);
        if (isNaN(date.getTime())) return acc;
      } catch {
        return acc;
      }
      
      let key;
      
      if (timeRange === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (timeRange === 'weekly') {
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      const total = (item.Price || 0) * (item.Quantity || 0);
      acc[key] = (acc[key] || 0) + total;
      return acc;
    }, {});

    const timeSeriesData = Object.entries(salesOverTime)
      .map(([name, value]) => ({ 
        name, 
        sales: parseFloat(value.toFixed(2)),
        date: name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Top products
    const productSales = processedData.reduce((acc, item) => {
      const product = item.ProductName || 'Unknown';
      const total = (item.Price || 0) * (item.Quantity || 0);
      acc[product] = (acc[product] || 0) + total;
      return acc;
    }, {});

    const topProducts = Object.entries(productSales)
      .map(([name, value]) => ({ name, sales: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);

    // Customer analysis
    const customerSpending = processedData.reduce((acc, item) => {
      const customer = item.CustomerNo || 'Unknown';
      const total = (item.Price || 0) * (item.Quantity || 0);
      acc[customer] = (acc[customer] || 0) + total;
      return acc;
    }, {});

    const topCustomers = Object.entries(customerSpending)
      .map(([name, value]) => ({ name: `Customer ${name}`, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Summary metrics
    const totalRevenue = processedData.reduce((sum, item) => sum + (item.Price || 0) * (item.Quantity || 0), 0);
    const totalTransactions = new Set(processedData.map(item => item.TransactionNo).filter(Boolean)).size;
    const totalProducts = new Set(processedData.map(item => item.ProductNo).filter(Boolean)).size;
    const totalCustomers = new Set(processedData.map(item => item.CustomerNo).filter(Boolean)).size;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      countryData,
      timeSeriesData,
      topProducts,
      topCustomers,
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalTransactions,
        totalProducts,
        totalCustomers,
        avgTransactionValue: parseFloat(avgTransactionValue.toFixed(2))
      }
    };
  }, [processedData, timeRange]);

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Colors for charts
  const COLORS = ['#D93954', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  // Debug: Check what data we're receiving
  console.log('Dashboard received data:', data);
  console.log('Processed data:', processedData);
  console.log('Chart data:', chartData);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
        <div className="text-center text-gray-400 py-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No data available for dashboard</p>
          <p className="text-sm mt-2">Please upload a file with sales data</p>
        </div>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
        <div className="text-center text-gray-400 py-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p>Invalid data format</p>
          <p className="text-sm mt-2">The uploaded file doesn't contain valid sales data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${chartData.summary?.totalRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-9 h- text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(chartData.summary?.totalTransactions || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(chartData.summary?.totalProducts || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Transaction</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${(chartData.summary?.avgTransactionValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Over Time */}
        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Sales Over Time</h3>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#404040] border border-gray-600 text-white rounded-lg px-3 py-1 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.timeSeriesData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#303030', border: '1px solid #444', borderRadius: '8px' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#D93954" fill="#D93954" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Country */}
        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-6">Top Countries by Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.countryData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#303030', border: '1px solid #444', borderRadius: '8px' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Sales']}
              />
              <Bar dataKey="value" fill="#D93954" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-6">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.topProducts || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sales"
              >
                {(chartData.topProducts || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#303030', border: '1px solid #444', borderRadius: '8px' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Sales']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-6">Top Customers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.topCustomers || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#303030', border: '1px solid #444', borderRadius: '8px' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spending']}
              />
              <Line type="monotone" dataKey="value" stroke="#4ECDC4" strokeWidth={2} dot={{ fill: '#4ECDC4' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;