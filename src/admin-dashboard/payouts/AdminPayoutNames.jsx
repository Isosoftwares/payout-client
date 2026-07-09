import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function AdminPayoutNames() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [depositAccount, setDepositAccount] = useState(null);
  const [payoutAccount, setPayoutAccount] = useState(null);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'all');

  useEffect(() => {
    if (location.state?.filter) {
      setStatusFilter(location.state.filter);
    }
  }, [location.state]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['admin-virtual-accounts'],
    queryFn: () => axios.get('/virtual-accounts'),
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to load accounts'),
  });

  const accounts = accountsData?.data?.data || [];

  const { mutate: updateBankDetails, isPending } = useMutation({
    mutationFn: (data) => axios.put(`/virtual-accounts/${selectedAccount._id}/bank-details`, data),
    onSuccess: () => {
      toast.success('Bank details updated successfully');
      queryClient.invalidateQueries(['admin-virtual-accounts']);
      setSelectedAccount(null);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update details'),
  });

  const { mutate: recordDeposit, isPending: isDepositing } = useMutation({
    mutationFn: (data) => axios.post('/transactions/deposit', data),
    onSuccess: () => {
      toast.success('Deposit recorded successfully');
      queryClient.invalidateQueries(['admin-virtual-accounts']);
      setDepositAccount(null);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to record deposit'),
  });

  const { mutate: recordPayout, isPending: isPayingOut } = useMutation({
    mutationFn: (data) => axios.post('/transactions/payout', data),
    onSuccess: () => {
      toast.success('Payout recorded successfully');
      queryClient.invalidateQueries(['admin-virtual-accounts']);
      setPayoutAccount(null);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to record payout'),
  });

  const onSubmit = (data) => {
    updateBankDetails(data);
  };

  const onSubmitDeposit = (data) => {
    recordDeposit({ ...data, virtualAccountId: depositAccount._id });
  };

  const onSubmitPayout = (data) => {
    recordPayout({ ...data, virtualAccountId: payoutAccount._id });
  };

  const filteredAccounts = accounts.filter((acc) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${acc.firstName} ${acc.lastName}`.toLowerCase();
    const stripeId = (acc.stripeAccountId || '').toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || stripeId.includes(searchLower);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && acc.status === statusFilter;
  }).sort((a, b) => {
    if (a.status === 'pending_bank_details' && b.status !== 'pending_bank_details') return -1;
    if (b.status === 'pending_bank_details' && a.status !== 'pending_bank_details') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Client Payout Names</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all virtual accounts/payout names created by clients. You can assign Stripe bank details here.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="max-w-md relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by client name or Stripe Account ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending_bank_details">Pending Details</option>
            <option value="active">Active</option>
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
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Identifier</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Balance</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center">No accounts found matching your search.</td></tr>
                  ) : (
                    filteredAccounts.map((acc) => (
                      <tr key={acc._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {acc.client?.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {acc.firstName} {acc.lastName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {acc.identifier || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-green-600">
                          ${(acc.withdrawableBalance <= 0 ? 0 : acc.balance || 0).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${acc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {acc.status === 'active' ? 'Active' : 'Pending Details'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setSelectedAccount(acc);
                                reset({
                                  bankName: acc.bankDetails?.bankName || '',
                                  accountNumber: acc.bankDetails?.accountNumber || '',
                                  routingNumber: acc.bankDetails?.routingNumber || '',
                                  stripeAccountId: acc.stripeAccountId || ''
                                });
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit Bank
                            </button>
                            <button
                              onClick={() => {
                                setDepositAccount(acc);
                                reset({ grossAmount: '', reference: '' });
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => {
                                setPayoutAccount(acc);
                                reset({ amount: '', reference: '' });
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Payout
                            </button>
                          </div>
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

      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Update Bank Details</h2>
            <p className="text-sm text-gray-600 mb-6">Assign Stripe details for {selectedAccount.firstName} {selectedAccount.lastName}</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Stripe Account ID</label>
                <input {...register('stripeAccountId')} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Bank Name</label>
                <input {...register('bankName', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Routing Number</label>
                <input {...register('routingNumber', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Account Number</label>
                <input {...register('accountNumber', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setSelectedAccount(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md">
                  {isPending ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {depositAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Record Deposit</h2>
            <p className="text-sm text-gray-600 mb-6">Add funds to {depositAccount.firstName} {depositAccount.lastName}</p>
            <form onSubmit={handleSubmit(onSubmitDeposit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Gross Amount ($)</label>
                <input type="number" step="0.01" {...register('grossAmount', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Reference</label>
                <input {...register('reference')} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setDepositAccount(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={isDepositing} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md">
                  {isDepositing ? 'Saving...' : 'Add Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payoutAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Record Payout</h2>
            <p className="text-sm text-gray-600 mb-6">Deduct funds sent from {payoutAccount.firstName} {payoutAccount.lastName}</p>
            <form onSubmit={handleSubmit(onSubmitPayout)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Amount ($) - Max: ${payoutAccount.withdrawableBalance.toFixed(2)}</label>
                <input type="number" step="0.01" {...register('amount', { required: true, max: payoutAccount.withdrawableBalance })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Reference</label>
                <input {...register('reference')} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setPayoutAccount(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={isPayingOut} className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md">
                  {isPayingOut ? 'Saving...' : 'Record Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
