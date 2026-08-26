import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function AdminTransactions() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { register, handleSubmit, reset } = useForm();

  const { data: accountsData } = useQuery({
    queryKey: ['admin-virtual-accounts'],
    queryFn: () => axios.get('/virtual-accounts?limit=1000'),
  });

  const { data: txData, isLoading } = useQuery({
    queryKey: ['admin-transactions', page, limit],
    queryFn: () => axios.get(`/transactions?page=${page}&limit=${limit}`),
    keepPreviousData: true,
  });

  const accounts = accountsData?.data?.data?.data?.filter(a => a.status === 'active') || [];
  const transactions = txData?.data?.data?.data || [];
  const totalPages = txData?.data?.data?.pages || 1;
  const totalItems = txData?.data?.data?.total || 0;

  const { mutate: recordDeposit, isPending } = useMutation({
    mutationFn: (data) => axios.post('/transactions/deposit', data),
    onSuccess: () => {
      toast.success('Deposit recorded successfully');
      queryClient.invalidateQueries(['admin-transactions']);
      queryClient.invalidateQueries(['admin-virtual-accounts']);
      setShowDepositModal(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to record deposit'),
  });

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-sm text-gray-700">All deposits and payouts across the platform.</p>
        </div>
        <button onClick={() => setShowDepositModal(true)} className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          Record Deposit
        </button>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Account</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Gross</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fee</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center">No transactions found.</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{tx.virtualAccount?.firstName} {tx.virtualAccount?.lastName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${tx.type === 'deposit' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'}`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">${tx.grossAmount.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${tx.feeAmount.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-gray-900">${tx.netAmount.toFixed(2)}</td>
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

      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Record Deposit</h2>
            <form onSubmit={handleSubmit((d) => recordDeposit(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Virtual Account</label>
                <select {...register('virtualAccountId', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option value="">Select an active account...</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.firstName} {acc.lastName} ({acc.client?.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Gross Amount Received ($)</label>
                <input type="number" step="0.01" {...register('grossAmount', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Reference (Optional)</label>
                <input {...register('reference')} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowDepositModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  {isPending ? 'Saving...' : 'Record Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
