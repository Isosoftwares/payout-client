import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

export default function AdminAllocationRequests() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('bulk'); // 'bulk' or 'specific'

  // --- Bulk Allocation State ---
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // --- Specific Requests State ---
  const [reqPage, setReqPage] = useState(1);
  const [reqStatusFilter, setReqStatusFilter] = useState('pending');
  const [reqSearch, setReqSearch] = useState('');
  const [selectedReqToApprove, setSelectedReqToApprove] = useState(null);
  const [approveBankDetails, setApproveBankDetails] = useState({ routingNumber: '', accountNumber: '' });
  const [selectedReqToReject, setSelectedReqToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Bulk Requests Query
  const { data: requestsData, isLoading: isLoadingBulk } = useQuery({
    queryKey: ['admin-allocation-requests', page, limit, statusFilter],
    queryFn: () => axios.get(`/payout-names/requests?page=${page}&limit=${limit}&status=${statusFilter}`),
    keepPreviousData: true,
    onError: () => toast.error('Failed to load allocation requests'),
  });

  const requests = requestsData?.data?.data || [];
  const totalPages = requestsData?.data?.pages || 1;
  const totalItems = requestsData?.data?.total || 0;

  // 2. Specific Requests Query
  const { data: specificReqsData, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['admin-specific-requests', reqPage, reqStatusFilter, reqSearch],
    queryFn: () => axios.get(`/payout-names/specific-requests?page=${reqPage}&limit=10&status=${reqStatusFilter}&search=${reqSearch}`),
    keepPreviousData: true,
  });

  const specificRequests = specificReqsData?.data?.data || [];
  const totalReqPages = specificReqsData?.data?.pages || 1;
  const totalReqItems = specificReqsData?.data?.total || 0;

  // 3. Pending Count Badges
  const { data: pendingBulkData } = useQuery({
    queryKey: ['admin-bulk-pending-count'],
    queryFn: () => axios.get('/payout-names/requests?status=pending&limit=1'),
    refetchInterval: 15000,
  });
  const pendingBulkCount = pendingBulkData?.data?.total || 0;

  const { data: pendingSpecificData } = useQuery({
    queryKey: ['admin-specific-pending-count'],
    queryFn: () => axios.get('/payout-names/specific-requests?status=pending&limit=1'),
    refetchInterval: 15000,
  });
  const pendingSpecificCount = pendingSpecificData?.data?.total || 0;

  // Bulk Request Mutation
  const { mutate: updateRequest, isPending: isUpdatingBulk } = useMutation({
    mutationFn: ({ id, data }) => axios.put(`/payout-names/requests/${id}`, data),
    onSuccess: () => {
      toast.success('Allocation request updated successfully');
      queryClient.invalidateQueries(['admin-allocation-requests']);
      queryClient.invalidateQueries(['admin-bulk-pending-count']);
      queryClient.invalidateQueries(['admin-allocation-requests-polling']);
      setSelectedRequest(null);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update request'),
  });

  const handleApprove = (data) => {
    updateRequest({ id: selectedRequest._id, data: { status: 'approved', allocatedCount: data.allocatedCount } });
  };

  const handleReject = (id) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
      updateRequest({ id, data: { status: 'rejected' } });
    }
  };

  // Specific Request Mutations
  const { mutate: approveSpecificRequest, isPending: isApprovingSpecific } = useMutation({
    mutationFn: ({ id, data }) => axios.put(`/payout-names/specific-requests/${id}/approve`, data),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Specific name request approved successfully');
      queryClient.invalidateQueries(['admin-specific-requests']);
      queryClient.invalidateQueries(['admin-specific-pending-count']);
      queryClient.invalidateQueries(['admin-specific-requests-polling']);
      queryClient.invalidateQueries(['admin-payout-names']);
      setSelectedReqToApprove(null);
      setApproveBankDetails({ routingNumber: '', accountNumber: '' });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to approve request');
    }
  });

  const { mutate: rejectSpecificRequest, isPending: isRejectingSpecific } = useMutation({
    mutationFn: ({ id, reason }) => axios.put(`/payout-names/specific-requests/${id}/reject`, { adminNote: reason }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Specific name request rejected');
      queryClient.invalidateQueries(['admin-specific-requests']);
      queryClient.invalidateQueries(['admin-specific-pending-count']);
      queryClient.invalidateQueries(['admin-specific-requests-polling']);
      setSelectedReqToReject(null);
      setRejectReason('');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to reject request');
    }
  });

  const handleApproveSpecificSubmit = (e) => {
    e.preventDefault();
    if (!approveBankDetails.routingNumber.trim() || !approveBankDetails.accountNumber.trim()) {
      toast.error('Both Routing Number and Account Number are required.');
      return;
    }
    approveSpecificRequest({ id: selectedReqToApprove._id, data: approveBankDetails });
  };

  const handleRejectSpecificSubmit = (e) => {
    e.preventDefault();
    rejectSpecificRequest({ id: selectedReqToReject._id, reason: rejectReason });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Allocation Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage client requests for payout name allocations (both bulk and specific name requests).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mt-6 mb-6 space-x-8">
        <button
          onClick={() => setActiveTab('bulk')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
            activeTab === 'bulk'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>Bulk Allocation Requests</span>
          {pendingBulkCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              {pendingBulkCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('specific')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
            activeTab === 'specific'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>Specific Name Requests</span>
          {pendingSpecificCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              {pendingSpecificCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BULK ALLOCATION REQUESTS */}
      {activeTab === 'bulk' && (
        <>
          <div className="flex justify-end mb-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="block w-full sm:w-48 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client Email</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requested</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Allocated</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {isLoadingBulk ? (
                        <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading requests...</td></tr>
                      ) : requests.length === 0 ? (
                        <tr><td colSpan="6" className="p-4 text-center text-gray-500">No bulk allocation requests found.</td></tr>
                      ) : (
                        requests.map((item) => (
                          <tr key={item._id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                              {item.client?.email || 'Unknown'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                              {item.requestedCount}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-blue-600">
                              {item.status === 'approved' ? item.allocatedCount : '-'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                                ${item.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  item.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-right pr-6">
                              {item.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedRequest(item);
                                      reset({ allocatedCount: item.requestedCount });
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(item._id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg shadow-sm mt-4">
                    <div className="text-sm text-gray-700">
                      Showing page {page} of {totalPages} ({totalItems} total)
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: SPECIFIC NAME REQUESTS */}
      {activeTab === 'specific' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="max-w-md relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by requested name or client..."
                value={reqSearch}
                onChange={(e) => {
                  setReqSearch(e.target.value);
                  setReqPage(1);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={reqStatusFilter}
                onChange={(e) => {
                  setReqStatusFilter(e.target.value);
                  setReqPage(1);
                }}
                className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requested Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target Subaccount</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bank Details</th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {isLoadingSpecific ? (
                        <tr><td colSpan="7" className="p-4 text-center text-gray-500">Loading requests...</td></tr>
                      ) : specificRequests.length === 0 ? (
                        <tr><td colSpan="7" className="p-4 text-center text-gray-500">No specific name requests found.</td></tr>
                      ) : (
                        specificRequests.map((req) => (
                          <tr key={req._id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                              <div>{req.client?.profile?.firstName ? `${req.client.profile.firstName} ${req.client.profile.lastName || ''}` : req.client?.email}</div>
                              <div className="text-xs text-gray-500">{req.client?.email}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-blue-600">
                              {req.requestedName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {req.subaccount ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                  Subaccount: {req.subaccount.username}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  Self (Main)
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                                ${req.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  req.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                              {req.status === 'rejected' && req.adminNote && (
                                <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={req.adminNote}>
                                  Note: {req.adminNote}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                              {req.status === 'approved' ? (
                                <div>
                                  <div>Acct: {req.accountNumber}</div>
                                  <div className="text-xs text-gray-400">Routing: {req.routingNumber}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              {req.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedReqToApprove(req);
                                      setApproveBankDetails({ routingNumber: '', accountNumber: '' });
                                    }}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors shadow-sm"
                                  >
                                    Approve & Bank Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedReqToReject(req);
                                      setRejectReason('');
                                    }}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalReqPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg shadow-sm mt-4">
                    <div className="text-sm text-gray-700">
                      Showing page {reqPage} of {totalReqPages} ({totalReqItems} total requests)
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => setReqPage(p => Math.max(1, p - 1))}
                        disabled={reqPage === 1}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setReqPage(p => Math.min(totalReqPages, p + 1))}
                        disabled={reqPage === totalReqPages}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Approve Allocation</h2>
            <p className="text-sm text-gray-500 mb-4">
              Client requested {selectedRequest.requestedCount} names. How many do you want to allocate?
            </p>
            <form onSubmit={handleSubmit(handleApprove)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Allocated Count <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="1"
                  {...register('allocatedCount', { required: true, min: 1 })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                />
                {errors.allocatedCount && <span className="text-xs text-red-500">Please enter a valid number.</span>}
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">Cancel</button>
                <button type="submit" disabled={isUpdatingBulk} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  {isUpdatingBulk ? 'Approving...' : 'Approve Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specific Approve Modal */}
      {selectedReqToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Approve Specific Payout Name</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter bank details for <strong className="text-gray-900">{selectedReqToApprove.requestedName}</strong> requested by <strong className="text-gray-900">{selectedReqToApprove.client?.email}</strong>.
            </p>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs mb-4">
              Target Subaccount: {selectedReqToApprove.subaccount ? selectedReqToApprove.subaccount.username : 'Self (Main Account)'}. 
              The system will check for duplicate names and account numbers before confirming.
            </div>
            <form onSubmit={handleApproveSpecificSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1029384756"
                  value={approveBankDetails.accountNumber}
                  onChange={(e) => setApproveBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Routing Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 021000021"
                  value={approveBankDetails.routingNumber}
                  onChange={(e) => setApproveBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedReqToApprove(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApprovingSpecific}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center"
                >
                  {isApprovingSpecific ? 'Confirming & Creating...' : 'Confirm & Approve Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specific Reject Modal */}
      {selectedReqToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Reject Specific Payout Name</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject the request for <strong className="text-gray-900">{selectedReqToReject.requestedName}</strong> by <strong className="text-gray-900">{selectedReqToReject.client?.email}</strong>?
            </p>
            <form onSubmit={handleRejectSpecificSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rejection Reason / Admin Note (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Unable to acquire bank account for this entity name."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedReqToReject(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejectingSpecific}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {isRejectingSpecific ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
