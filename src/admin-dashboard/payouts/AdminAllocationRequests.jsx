import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

export default function AdminAllocationRequests() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['admin-allocation-requests', page, limit, statusFilter],
    queryFn: () => axios.get(`/payout-names/requests?page=${page}&limit=${limit}&status=${statusFilter}`),
    keepPreviousData: true,
    onError: (err) => toast.error('Failed to load requests'),
  });

  const requests = requestsData?.data?.data || [];
  const totalPages = requestsData?.data?.pages || 1;
  const totalItems = requestsData?.data?.total || 0;

  const { mutate: updateRequest, isPending } = useMutation({
    mutationFn: ({ id, data }) => axios.put(`/payout-names/requests/${id}`, data),
    onSuccess: () => {
      toast.success('Request updated successfully');
      queryClient.invalidateQueries(['admin-allocation-requests']);
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

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Allocation Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage client requests for payout name allocations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="block w-full sm:w-48 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client Email</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requested</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Allocated</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center">No requests found.</td></tr>
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
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                          {item.status === 'pending' && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setSelectedRequest(item);
                                  reset({ allocatedCount: item.requestedCount });
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(item._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </div>
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

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Approve Allocation</h2>
            <p className="text-sm text-gray-500 mb-4">
              Client requested {selectedRequest.requestedCount} names. How many do you want to allocate?
            </p>
            <form onSubmit={handleSubmit(handleApprove)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Allocated Count <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="1"
                  {...register('allocatedCount', { required: true, min: 1 })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {errors.allocatedCount && <span className="text-xs text-red-500">Please enter a valid number.</span>}
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isPending ? 'Approving...' : 'Approve Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
