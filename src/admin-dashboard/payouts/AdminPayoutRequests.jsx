import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function AdminPayoutRequests() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['admin-payout-requests'],
    queryFn: () => axios.get('/transactions/payout-requests'),
    onError: (err) => toast.error('Failed to load requests'),
  });

  const requests = requestsData?.data?.data || [];

  const { mutate: updateRequest, isPending: isUpdating } = useMutation({
    mutationFn: (data) => axios.put(`/transactions/payout-requests/${selectedRequest._id}`, data),
    onSuccess: () => {
      toast.success('Request updated');
      queryClient.invalidateQueries(['admin-payout-requests']);
      setSelectedRequest(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const { mutate: processPayout, isPending: isProcessing } = useMutation({
    mutationFn: (data) => axios.post('/transactions/payout', data),
    onSuccess: () => {
      toast.success('Payout processed successfully');
      queryClient.invalidateQueries(['admin-payout-requests']);
      setSelectedRequest(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to process payout'),
  });

  const onSubmitUpdate = (data) => {
    if (data.action === 'process') {
      processPayout({
        virtualAccountId: selectedRequest.virtualAccount._id,
        amount: selectedRequest.amount,
        reference: data.reference,
        payoutRequestId: selectedRequest._id
      });
    } else {
      updateRequest({ expectedDate: data.expectedDate, status: data.status });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Payout Requests</h1>
          <p className="mt-2 text-sm text-gray-700">Manage client payout requests.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Account</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expected Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative px-3 py-3.5"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center">No requests found.</td></tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{req.client?.email}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{req.virtualAccount?.firstName} {req.virtualAccount?.lastName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-blue-600">${req.amount.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {req.expectedDate ? new Date(req.expectedDate).toLocaleDateString() : 'Not Set'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                            ${req.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              req.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                              req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          {req.status !== 'completed' && req.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                reset({ status: req.status, expectedDate: req.expectedDate ? req.expectedDate.split('T')[0] : '' });
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Manage
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Manage Request</h2>
            <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Update Status / Date</label>
                <div className="flex gap-2 mt-1">
                  <select {...register('status')} className="px-3 py-2 border rounded-md flex-1">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input type="date" {...register('expectedDate')} className="px-3 py-2 border rounded-md flex-1" />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-green-700">Or Process Payout Immediately</label>
                <input {...register('reference')} placeholder="Stripe Transfer Ref" className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <div className="flex gap-2">
                  <button type="submit" onClick={() => reset({ ...register().value, action: 'update' })} className="px-4 py-2 bg-gray-600 text-white rounded-md">Update Only</button>
                  <button type="submit" onClick={handleSubmit((d) => onSubmitUpdate({ ...d, action: 'process' }))} disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white rounded-md">
                    Process Payout
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
