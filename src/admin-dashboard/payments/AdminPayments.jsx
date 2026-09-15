import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { ArrowUpTrayIcon, Cog6ToothIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AdminPayments() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [uploadReport, setUploadReport] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Settings State
  const [localSettings, setLocalSettings] = useState([]);

  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['maturity-settings'],
    queryFn: () => axios.get('/payments/maturity-settings')
  });

  const { data: historiesData, isLoading: isLoadingHistories } = useQuery({
    queryKey: ['payment-upload-histories'],
    queryFn: () => axios.get('/payments/upload-histories')
  });
  const histories = historiesData?.data?.data || [];

  React.useEffect(() => {
    if (settingsData?.data?.data) {
      setLocalSettings(settingsData.data.data);
    }
  }, [settingsData]);

  const { mutate: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: (formData) => axios.post('/payments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setUploadReport(res.data);
      queryClient.invalidateQueries(['admin-payout-names']);
      queryClient.invalidateQueries(['payment-upload-histories']);
      setFile(null);
      document.getElementById('csv-upload').value = '';
      
      if (res.data.errors && res.data.errors.length > 0 && res.data.historyId) {
        // Automatically trigger download or offer it
        handleDownloadReport(res.data.historyId);
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to upload payments file'),
  });

  const { mutate: updateSettings, isPending: isUpdatingSettings } = useMutation({
    mutationFn: (data) => axios.put('/payments/maturity-settings', { settings: data }),
    onSuccess: (res) => {
      toast.success('Maturity settings updated');
      queryClient.invalidateQueries(['maturity-settings']);
      setShowSettings(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update settings'),
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadFile(formData);
  };

  const handleSettingChange = (id, newOffset) => {
    setLocalSettings(prev => prev.map(s => s._id === id ? { ...s, offsetDays: Number(newOffset) } : s));
  };

  const handleDownloadReport = async (historyId) => {
    try {
      const response = await axios.get(`/payments/upload-histories/${historyId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `upload_errors_${historyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(ext)) {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a CSV or Excel (.xlsx, .xls) file');
      }
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8" onDragOver={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}>
      <div className="sm:flex sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Upload CSV or Excel files with payment details to automatically update payout balances and trigger maturity periods.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              if (settingsData?.data?.data) setLocalSettings(settingsData.data.data);
              setShowSettings(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
            Maturity Settings
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Payments (CSV or Excel)</h2>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <form onSubmit={handleUpload} onDragOver={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()} className="flex-1 max-w-2xl">
            <div className="flex items-center gap-4">
              <label 
                htmlFor="csv-upload"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-400 scale-[1.01]' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <div className="space-y-1 text-center pointer-events-none">
                  <ArrowUpTrayIcon className={`mx-auto h-8 w-8 ${isDragging ? 'text-blue-600 animate-bounce' : 'text-gray-400'}`} />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Upload a file
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">CSV or Excel (.xlsx, .xls) must contain: Name, Amount, Date</p>
                  {file && (
                    <p className="text-sm font-semibold text-green-600 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
                <input 
                  type="file" 
                  id="csv-upload"
                  accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              <button 
                type="submit" 
                disabled={!file || isUploading}
                className="px-6 py-6 h-full bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Process File'}
              </button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <strong>Format Example:</strong> Name, Amount, Date (CSV, XLSX, or XLS)
              </p>
              <a 
                href="/sample-payments.csv" 
                download
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Download Sample CSV
              </a>
            </div>
          </form>
        </div>

        {uploadReport && (
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Upload Report</h3>
            </div>
            <p className="text-sm text-gray-700 mb-2">{uploadReport.message}</p>
            
            {uploadReport.errors && uploadReport.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-red-600 text-sm mb-1">Errors/Skipped Details:</p>
                <div className="max-h-40 overflow-y-auto text-xs text-red-500 bg-red-50 p-3 rounded-md border border-red-100 space-y-1">
                  {uploadReport.errors.map((err, idx) => (
                    <div key={idx}>Row {err.rowNum}: {err.reason}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matched</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingHistories ? (
                <tr><td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">Loading history...</td></tr>
              ) : histories.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">No upload history found.</td></tr>
              ) : (
                histories.map((history) => (
                  <tr key={history._id}>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(history.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {history.fileName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {history.uploadedBy?.profile?.firstName 
                        ? `${history.uploadedBy.profile.firstName} ${history.uploadedBy.profile.lastName || ''}`
                        : history.uploadedBy?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {history.totalProcessed}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium whitespace-nowrap">
                      {history.totalMatched}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium whitespace-nowrap">
                      {history.errors?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                      {history.errors && history.errors.length > 0 ? (
                        <button
                          onClick={() => handleDownloadReport(history._id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Download Report
                        </button>
                      ) : (
                        <span className="text-gray-400">No Errors</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Maturity Rules</h2>
              <p className="text-xs text-gray-500 mt-1">Configure how many days until a payment matures based on the day it was received.</p>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {isLoadingSettings ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : localSettings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No maturity settings found.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {localSettings.map((setting) => (
                    <div key={setting._id} className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-gray-700 w-24">{setting.dayName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">+</span>
                        <input
                          type="number"
                          min="0"
                          max="14"
                          value={setting.offsetDays}
                          onChange={(e) => handleSettingChange(setting._id, e.target.value)}
                          className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        />
                        <span className="text-sm text-gray-500">days</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => updateSettings(localSettings)}
                disabled={isUpdatingSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdatingSettings ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
