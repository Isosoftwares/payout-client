import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function PayoutNames() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['client-inventory', searchTerm],
    queryFn: () => axios.get(`/payout-names/my-inventory?search=${searchTerm}`),
    keepPreviousData: true,
  });

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['client-allocation-requests', page, limit],
    queryFn: () => axios.get(`/payout-names/requests/me?page=${page}&limit=${limit}`),
    keepPreviousData: true,
    onError: (err) => toast.error('Failed to load requests'),
  });

  const { data: subaccountsData } = useQuery({
    queryKey: ['subaccounts'],
    queryFn: () => axios.get('/subaccounts'),
  });

  const subaccounts = subaccountsData?.data?.data || [];

  const requests = requestsData?.data?.data || [];
  const totalPages = requestsData?.data?.pages || 1;
  const totalItems = requestsData?.data?.total || 0;

  const allocatedCount = inventoryData?.data?.data?.allocatedCount || 0;
  const claimedNames = inventoryData?.data?.data?.claimedNames || [];

  const { mutate: requestAllocation, isPending: isRequesting } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/request', data),
    onSuccess: () => {
      toast.success('Allocation requested successfully');
      queryClient.invalidateQueries(['client-allocation-requests']);
      setShowRequestModal(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to request allocation'),
  });

  const [showClaimModal, setShowClaimModal] = useState(false);
  const { register: registerClaim, handleSubmit: handleClaimSubmit, reset: resetClaim, formState: { errors: claimErrors } } = useForm();

  const { mutate: claimNames, isPending: isClaiming } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/claim', data),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Names claimed successfully');
      queryClient.invalidateQueries(['client-inventory']);
      setShowClaimModal(false);
      resetClaim();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to claim names'),
  });

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header and Stats */}
      <div className="sm:flex sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Names Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Request allocations, track your approvals, and claim names to reveal banking details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-4 items-center">
          <div className="px-4 py-2 bg-white text-primary rounded-lg font-medium border border-primary shadow-sm">
            Unclaimed Available: {allocatedCount}
          </div>
          <button
            onClick={() => setShowClaimModal(true)}
            disabled={allocatedCount === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/80 disabled:bg-gray-300 whitespace-nowrap text-sm shadow-sm transition-colors"
          >
            Claim Names
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap text-sm shadow-sm transition-colors"
          >
            Request New Allocation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Claimed Names Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Claimed Names (Active)</h2>
              <p className="text-xs text-gray-500">These are your ready-to-use payout details.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search name or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acct Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Routing Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Claimed For</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Maturity Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingInventory ? (
                  <tr><td colSpan="7" className="p-6 text-center text-gray-500">Loading inventory...</td></tr>
                ) : claimedNames.length === 0 ? (
                  <tr><td colSpan="7" className="p-6 text-center text-gray-500">You haven't claimed any names yet (or none match search).</td></tr>
                ) : (
                  claimedNames.map(name => (
                    <tr key={name._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {name.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {name.accountNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {name.routingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {name.claimedForSubaccount ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {name.claimedForSubaccount.username}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Self
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${name.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 
                          ${name.paymentStatus === 'not_received' ? 'bg-gray-100 text-gray-800' : 
                            name.paymentStatus === 'received' ? 'bg-blue-100 text-blue-800' : 
                            name.paymentStatus === 'matured' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'}`}>
                          {name.paymentStatus ? name.paymentStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not Received'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {name.maturityDate ? new Date(name.maturityDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Allocation Requests History</h2>
            <p className="text-xs text-gray-500">Track the status of your requested names.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingRequests ? (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-500">Loading requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-500">No requests found.</td></tr>
                ) : (
                  requests.map(req => (
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {req.requestedCount}
                        {req.status === 'approved' && req.allocatedCount !== req.requestedCount && (
                          <span className="text-gray-500 ml-1">(Granted: {req.allocatedCount})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          req.status === 'approved' ? 'bg-green-100 text-green-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
          {/* ... pagination goes here (keeping the logic below) */}

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
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
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
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
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Request Payout Names</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the number of names you want to request allocation for.</p>
            <form onSubmit={handleSubmit((d) => requestAllocation(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Quantity Requested <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="1"
                  {...register('requestedCount', { required: true, min: 1 })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {errors.requestedCount && <span className="text-xs text-red-500">Please enter a valid number.</span>}
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isRequesting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isRequesting ? 'Requesting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Claim Allocated Names</h2>
            <p className="text-sm text-gray-500 mb-4">
              You currently have <strong className="text-gray-900">{allocatedCount}</strong> names allocated to you. 
              How many would you like to claim right now to reveal their banking details?
            </p>
            <form onSubmit={handleClaimSubmit((d) => claimNames(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Quantity to Claim <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="1"
                  max={allocatedCount}
                  {...registerClaim('count', { 
                    required: "Required", 
                    min: { value: 1, message: "Minimum 1" },
                    max: { value: allocatedCount, message: `Maximum ${allocatedCount}` }
                  })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {claimErrors.count && <span className="text-xs text-red-500">{claimErrors.count.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium">Claim For <span className="text-red-500">*</span></label>
                <select
                  {...registerClaim('subaccountId')}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white"
                >
                  <option value="self">Self (Main Account)</option>
                  {subaccounts.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      Subaccount: {sub.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => { setShowClaimModal(false); resetClaim(); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isClaiming} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-yellow-600">
                  {isClaiming ? 'Claiming...' : 'Claim Names'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
