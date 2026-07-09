import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function PayoutRequests() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const { data: accountsData } = useQuery({
    queryKey: ['client-virtual-accounts'],
    queryFn: () => axios.get('/virtual-accounts'),
  });

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['client-payout-requests'],
    queryFn: () => axios.get('/transactions/payout-requests'),
  });

  const accounts = accountsData?.data?.data?.filter(a => a.status === 'active') || [];
  const requests = requestsData?.data?.data || [];

  const { mutate: requestPayout, isPending } = useMutation({
    mutationFn: (data) => axios.post('/transactions/payout-requests', data),
    onSuccess: () => {
      toast.success('Payout requested successfully');
      queryClient.invalidateQueries(['client-payout-requests']);
      setShowRequestModal(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to request payout'),
  });

  const selectedAccountId = watch('virtualAccountId');
  const selectedAccount = accounts.find(a => a._id === selectedAccountId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Requests</h1>
          <p className="mt-1 text-sm text-gray-500">Request a withdrawal from your active payout names.</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Request Payout
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date Requested</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Payout Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Expected Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">Loading requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">No payout requests found.</td></tr>
              ) : (
                requests.map(req => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.virtualAccount?.firstName} {req.virtualAccount?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      ${req.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.expectedDate ? new Date(req.expectedDate).toLocaleDateString() : 'Awaiting Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        req.status === 'completed' ? 'bg-green-100 text-green-800' :
                        req.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Request New Payout</h2>
            <form onSubmit={handleSubmit((d) => requestPayout(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Select Payout Name</label>
                <select {...register('virtualAccountId', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option value="">Select an active account...</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.firstName} {acc.lastName} - Avail: ${acc.withdrawableBalance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccount && (
                <div>
                  <label className="block text-sm font-medium">Amount to Withdraw ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('amount', { 
                      required: 'Amount is required', 
                      min: { value: 0.01, message: 'Must be greater than 0' },
                      max: { value: selectedAccount.withdrawableBalance, message: 'Exceeds available balance' }
                    })} 
                    className="w-full mt-1 px-3 py-2 border rounded-md" 
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isPending || !selectedAccount} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isPending ? 'Requesting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
