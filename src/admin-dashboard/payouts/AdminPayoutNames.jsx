import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { MagnifyingGlassIcon, ArrowUpTrayIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import PayoutNameLogsModal from '../../components/PayoutNameLogsModal';

export default function AdminPayoutNames() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [allocateToClientId, setAllocateToClientId] = useState('');
  const [uploadReport, setUploadReport] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [selectedPayoutNameForLogs, setSelectedPayoutNameForLogs] = useState(null);

  // Clients for optional pre-allocation dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['admin-clients-dropdown'],
    queryFn: () => axios.get('/users?role=client&limit=1000'),
  });
  const clients = clientsData?.data?.data?.users || [];

  const { data: payoutNamesData, isLoading } = useQuery({
    queryKey: ['admin-payout-names', page, limit, searchTerm, statusFilter, paymentStatusFilter],
    queryFn: () => axios.get(`/payout-names?page=${page}&limit=${limit}&search=${searchTerm}&status=${statusFilter}&paymentStatus=${paymentStatusFilter}`),
    keepPreviousData: true,
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to load payout names'),
  });

  const payoutNames = payoutNamesData?.data?.data || [];
  const totalPages = payoutNamesData?.data?.pages || 1;
  const totalItems = payoutNamesData?.data?.total || 0;

  const { mutate: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: (formData) => axios.post('/payout-names/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setUploadReport(res.data.report);
      queryClient.invalidateQueries(['admin-payout-names']);
      queryClient.invalidateQueries(['admin-clients']);
      queryClient.invalidateQueries(['admin-allocation-requests']);
      setFile(null);
      setAllocateToClientId('');
      const input = document.getElementById('csv-upload');
      if (input) input.value = '';
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to upload file'),
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (allocateToClientId) {
      formData.append('allocateToClientId', allocateToClientId);
    }
    uploadFile(formData);
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
    }
  };

  const { mutate: deletePayoutName, isPending: isDeleting } = useMutation({
    mutationFn: (id) => axios.delete(`/payout-names/${id}`),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Payout name deleted successfully');
      queryClient.invalidateQueries(['admin-payout-names']);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete payout name'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this payout name?')) {
      deletePayoutName(id);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" onDragOver={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Payout Names Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage the pool of payout names available for clients, upload new batches via CSV or Excel, and inspect or pre-allocate names.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Payout Names (CSV or Excel)</h2>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <form onSubmit={handleUpload} onDragOver={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()} className="flex-1 max-w-2xl space-y-4">
            {/* Optional Allocation Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocate to Client (Optional)
              </label>
              <select
                value={allocateToClientId}
                onChange={(e) => setAllocateToClientId(e.target.value)}
                className="block w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
              >
                <option value="">-- Available Pool (No client pre-allocation) --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.profile?.firstName ? `${c.profile.firstName} ${c.profile.lastName || ''} (${c.email})` : c.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a client if you want all uploaded names in this batch to be pre-allocated to them so they can claim them at will.
              </p>
            </div>

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
                  <p className="text-xs text-gray-500">CSV or Excel (.xlsx, .xls) up to 10MB</p>
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
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              <button 
                type="submit" 
                disabled={!file || isUploading}
                className="px-6 py-6 h-full bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload Data'}
              </button>
            </div>
          </form>
          <div className="flex-shrink-0">
            <a 
              href="data:text/csv;charset=utf-8,Name,Routing Number,Account Number,Client Email%0AJohn Doe,123456789,987654321,%0AJane Smith,987654321,123456789,"
              download="payout_names_sample.csv"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Download Sample CSV
            </a>
          </div>
        </div>

        {uploadReport && (
          <div className="mt-4 p-4 rounded-md bg-gray-50 border border-gray-200">
            <h3 className="font-semibold text-gray-900">Upload Report</h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>Total Processed: {uploadReport.totalProcessed}</li>
              <li className="text-green-600 font-medium">Successfully Added: {uploadReport.added}</li>
              {uploadReport.allocatedTo && (
                <li className="text-blue-600 font-medium">Pre-Allocated To: {uploadReport.allocatedTo}</li>
              )}
              <li className="text-yellow-600">Duplicates Skipped: {uploadReport.duplicates}</li>
            </ul>
            {uploadReport.errors && uploadReport.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-red-600 text-sm">Errors/Duplicates Details:</p>
                <div className="mt-1 max-h-32 overflow-y-auto text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  {uploadReport.errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="max-w-md relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Allocation Statuses</option>
            <option value="available">Available</option>
            <option value="allocated">Allocated</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
          >
            <option value="all">All Payment Statuses</option>
            <option value="received">Received</option>
            <option value="matured">Matured</option>
            <option value="paid">Paid</option>
            <option value="not_received">Not Received</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Routing Number</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Account Number</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status / Allocation</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Claimed Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payment Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Maturity Date</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="9" className="p-4 text-center">Loading...</td></tr>
                  ) : payoutNames.length === 0 ? (
                    <tr><td colSpan="9" className="p-4 text-center">No names found.</td></tr>
                  ) : (
                    payoutNames.map((item) => (
                      <tr key={item._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.routingNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.accountNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                            ${item.status === 'available' ? 'bg-green-100 text-green-800' : 
                              item.status === 'allocated' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                          {item.allocatedTo && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs" title={item.allocatedTo.email}>
                              {item.allocatedTo.profile?.firstName ? `${item.allocatedTo.profile.firstName} (${item.allocatedTo.email})` : item.allocatedTo.email}
                            </div>
                          )}
                          {item.claimedForSubaccount && (
                            <div className="text-xs text-blue-600 font-medium">
                              Subaccount: {item.claimedForSubaccount.username}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-600">
                          {item.claimedAt ? (
                            <span className="font-medium text-gray-800">
                              {new Date(item.claimedAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Unclaimed / Legacy</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          ${item.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                            ${item.paymentStatus === 'not_received' ? 'bg-gray-100 text-gray-800' : 
                              item.paymentStatus === 'received' ? 'bg-blue-100 text-blue-800' : 
                              item.paymentStatus === 'matured' ? 'bg-green-100 text-green-800' : 
                              'bg-purple-100 text-purple-800'}`}>
                            {item.paymentStatus ? item.paymentStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not Received'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {item.paymentStatus === 'received' && item.maturityDate ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs w-max">
                                {new Date(item.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-blue-600 font-medium mt-0.5">Maturing</span>
                            </div>
                          ) : item.paymentStatus === 'matured' && item.maturityDate ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 text-xs w-max">
                                {new Date(item.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-green-600 font-medium mt-0.5">Matured</span>
                            </div>
                          ) : item.maturityDate ? (
                            <span className="text-xs text-gray-600">
                              {new Date(item.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedPayoutNameForLogs(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Activity Logs & Narration"
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              disabled={isDeleting || item?.allocatedTo || item?.claimedForSubaccount}
                              className={`text-red-600 hover:text-red-900 disabled:opacity-50 ${item?.allocatedTo || item?.claimedForSubaccount ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              title={item?.allocatedTo || item?.claimedForSubaccount ? "Cannot delete allocated or claimed payout names" : "Delete"}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg shadow-sm">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${page === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${page === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalItems)}</span> of{' '}
                      <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalPages)].map((_, idx) => (
                        <button
                          key={idx + 1}
                          onClick={() => handlePageChange(idx + 1)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === idx + 1 ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                        >
                          {idx + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      <PayoutNameLogsModal
        isOpen={!!selectedPayoutNameForLogs}
        onClose={() => setSelectedPayoutNameForLogs(null)}
        payoutNameId={selectedPayoutNameForLogs?._id}
        payoutNameTitle={selectedPayoutNameForLogs?.name}
      />
    </div>
  );
}
