import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { CurrencyDollarIcon, BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ClientDashboard() {
  const axios = useAxiosPrivate();

  const { data: accountsData } = useQuery({
    queryKey: ['client-virtual-accounts'],
    queryFn: () => axios.get('/virtual-accounts')
  });

  const { data: txData } = useQuery({
    queryKey: ['client-transactions'],
    queryFn: () => axios.get('/transactions?limit=5')
  });

  const accounts = accountsData?.data?.data || [];
  const recentTransactions = txData?.data?.data || [];

  const totalGross = accounts.reduce((sum, acc) => sum + (acc.withdrawableBalance <= 0 ? 0 : acc.balance || 0), 0);
  const totalWithdrawable = accounts.reduce((sum, acc) => sum + (acc.withdrawableBalance || 0), 0);

  const activeAccounts = accounts.filter(a => a.status === 'active').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-gray-500">Here's an overview of your accounts and balances.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Gross Balance</dt>
                <dd className="text-2xl font-bold text-gray-900">${totalGross.toFixed(2)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Available for Payout</dt>
                <dd className="text-2xl font-bold text-blue-600">${totalWithdrawable.toFixed(2)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Payout Names</dt>
                <dd className="text-2xl font-bold text-gray-900">{activeAccounts} / {accounts.length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentTransactions.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">No recent transactions.</li>
          ) : (
            recentTransactions.map((tx) => (
              <li key={tx._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.virtualAccount?.firstName} {tx.virtualAccount?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.type.toUpperCase()}
                    </span>
                    <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx?.netAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
