import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';

export default function Transactions() {
  const axios = useAxiosPrivate();

  const { data: txData, isLoading } = useQuery({
    queryKey: ['client-transactions'],
    queryFn: () => axios.get('/transactions'),
  });

  const transactions = txData?.data?.data || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction Ledger</h1>
        <p className="mt-1 text-sm text-gray-500">View all incoming deposits and outgoing payouts for your accounts.</p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Account</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount (Net)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">No transactions found.</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.virtualAccount?.firstName} {tx.virtualAccount?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.netAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.reference || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
