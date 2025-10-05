import React, { useEffect, useState, useMemo } from 'react';
import { usePapaParse } from 'react-papaparse';
import * as XLSX from 'xlsx';
import axios from "axios";
import Dashboard from '../components/Dashboard';
import TalkToData from '../components/TalkToData';

const CortexPage = () => {
  const [fileData, setFileData] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { readString } = usePapaParse();

  const [comingData, setcomingData] = useState([])

  const [backendLoading, setBackendLoading] = useState(false);


  const getDataFromFile = async () => {
    if (!uploadedFile) return;

    setBackendLoading(true); // start loading

    const formData = new FormData();  // FormData is a special browser API for sending files or form fields in a multipart/form-data request.
    formData.append("file", uploadedFile);

    try {
      const response = await axios.post("http://localhost:8000/csv-list", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response.data);
      setcomingData(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setBackendLoading(false); // done loading
    }
  };




  useEffect(() => {
    getDataFromFile();
  }, [uploadedFile]);



  const handleFileUpload = (file) => {
    setUploadedFile(file);
    console.log("Uploaded file:", file);

    if (file) {
      const fileType = file.type;

      if (fileType === 'text/csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csvData = e.target.result;
          readString(csvData, {
            header: true,
            complete: (results) => {
              setFileData({
                name: file.name,
                content: results.data,
                type: 'csv'
              });
              setPreviewData(results.data.slice(0, 10));
            },
          });
        };
        reader.readAsText(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel'
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headers = jsonData[0];
          const rows = jsonData.slice(1).map((row) =>
            headers.reduce((acc, header, index) => {
              acc[header] = row[index];
              return acc;
            }, {})
          );

          setFileData({
            name: file.name,
            content: rows,
            type: 'excel'
          });
          setPreviewData(rows.slice(0, 10));
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert('Please upload a valid .csv or .xlsx file.');
      }
    }
  };

  const handleProcessDataset = () => {
    setIsProcessing(true);

    // Wait for 2 seconds then show tabs
    setTimeout(() => {
      setShowTabs(true);
      setIsProcessing(false);
    }, 2000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const removeFile = () => {
    setFileData(null);
    setPreviewData([]);
    setUploadedFile(null);
  };

  // Tab content components
  const DashboardTab = () => {
    // Ensure we have valid data - pass the entire fileData.content object
    const dashboardData = useMemo(() => {
      if (!fileData?.content) return null;
      
      // Pass the entire content object - the Dashboard will extract the array
      return fileData.content;
    }, [fileData]);
  
    return (
      <div className=" p-6 mt-6">
        <h2 className="text-2xl font-bold text-white mb-6">Sales Analytics Dashboard</h2>
        <Dashboard data={dashboardData} />
      </div>
    );
  };

  const MLModuleTab = () => (
    <div className="bg-[#303030] rounded-2xl p-6 border border-gray-600 mt-6">
      <h2 className="text-2xl font-bold text-white mb-4">ML Module</h2>
      <p className="text-gray-300">Machine learning features and models will be available here.</p>
      {/* Add your ML components here */}
    </div>
  );

  const TalkToDataTab = () => (
    <div className="p-6 mt-6">
      <TalkToData  file={uploadedFile}/>
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      <img src="/bgLeft.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 right-0" />
      <img src="/bgRight.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 left-0" />

      {/* Header / Hero Section */}
      <header className="text-center mb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cortex: The Intelligence Core
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Upload your sales data and unlock AI-powered insights to drive your business forward.
          </p>
        </div>
      </header>

      {/* Tabs Navigation - Only show after processing */}
      {showTabs && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex space-x-1  p-2 ">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'dashboard'
                  ? 'bg-[#D93954] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-[#383838]'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('talk-to-data')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'talk-to-data'
                  ? 'bg-[#D93954] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-[#383838]'
                }`}
            >
              Talk to Data
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {!showTabs ? (
          /* Original Upload and Preview Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Upload Box - Left Side */}
            <div
              className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 h-fit ${isDragging
                  ? 'border-red-500 bg-[#404040] scale-105'
                  : 'border-gray-600 bg-[#303030] hover:border-red-400 hover:bg-[#383838]'
                } shadow-lg hover:shadow-xl ${isProcessing ? 'opacity-50 pointer-events-none' : ''
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-[#D93954] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {isDragging ? 'Drop your file here' : 'Upload your data file'}
                  </h3>
                  <p className="text-gray-400">
                    Drag and drop your .csv or .xlsx file here, or
                  </p>
                </div>

                <label className={`cursor-pointer bg-[#D93954] hover:bg-[#D93954] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg ${isProcessing ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={isProcessing}
                  />
                  Browse Files
                </label>

                <p className="text-sm text-gray-500 mt-2">
                  Supports CSV and Excel files. Maximum file size: 10MB
                </p>
              </div>

              {/* File Upload Confirmation - Inside Upload Box */}
              {fileData && (
                <div className="mt-6 p-4 bg-[#404040] rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">File Uploaded!</h4>
                        <p className="text-xs text-gray-300">{fileData.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors duration-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Section - Right Side */}
            <div className="flex flex-col">
              {fileData ? (
                <div className={`rounded-2xl shadow-lg p-6 animate-fade-in bg-[#303030] border border-gray-600 h-full ${isProcessing ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Data Preview</h2>
                      <p className="text-sm text-gray-400">First 10 rows of your uploaded data</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                        {fileData.type.toUpperCase()}
                      </span>
                      <span className="text-xs bg-green-900 text-white px-2 py-1 rounded-full">
                        {previewData.length} rows
                      </span>
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div className="border border-gray-600 rounded-lg overflow-hidden flex-1">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-[#404040] sticky top-0">
                          <tr>
                            {previewData.length > 0 &&
                              Object.keys(previewData[0]).map((key, index) => (
                                <th
                                  key={index}
                                  className="px-4 py-3 text-left text-xs text-gray-300 uppercase tracking-wider border-r border-gray-600 last:border-r-0 font-semibold bg-gray-800"
                                >
                                  {key}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                          {previewData.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={rowIndex % 2 === 0 ? 'bg-[#303030]' : 'bg-[#383838]'}
                            >
                              {Object.values(row).map((value, colIndex) => (
                                <td
                                  key={colIndex}
                                  className="px-4 py-3 text-sm text-gray-300 border-r border-gray-600 last:border-r-0 whitespace-nowrap"
                                >
                                  {value || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleProcessDataset}
                      disabled={backendLoading }
                      className={`px-4 py-2 text-sm font-medium text-white bg-[#D93954] rounded-lg hover:bg-[#d93954d9] transition-colors duration-200 cursor-pointer ${isProcessing || backendLoading || !comingData.length ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : backendLoading ? (
                        "Waiting for backend..."
                      ) : (
                        'Process Dataset'
                      )}
                    </button>

                  </div>
                </div>
              ) : (
                /* Empty Preview State */
                <div className="rounded-2xl shadow-lg p-8 bg-[#303030] border border-gray-600 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Data Preview</h3>
                  <p className="text-gray-400 text-sm">
                    Upload a file to see the data preview here. Your dataset will appear in this section.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Tab Content */
          <div>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'talk-to-data' && <TalkToDataTab />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CortexPage;