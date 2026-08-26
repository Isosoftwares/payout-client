import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { UsersIcon, BanknotesIcon, ArrowPathIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

export default function DashboardOverview() {
  const axios = useAxiosPrivate();

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => axios.get('/users'),
  });



  const { data: txData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['admin-transactions-log'],
    queryFn: () => axios.get('/batch-payouts/transactions'),
  });

  const { data: availableData, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['admin-payout-names-available'],
    queryFn: () => axios.get('/payout-names?status=available&limit=1'),
  });

  const { data: allocatedData, isLoading: isLoadingAllocated } = useQuery({
    queryKey: ['admin-payout-names-allocated'],
    queryFn: () => axios.get('/payout-names?status=allocated&limit=1'),
  });

  if (isLoadingUsers || isLoadingTx || isLoadingAvailable || isLoadingAllocated) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const users = usersData?.data?.data?.users || [];
  const transactions = txData?.data?.data || [];

  const clientUsers = users.filter(u => u.role === 'client');
  const clientUsersCount = clientUsers.length;
  
  // Calculate system-wide totals directly from User model accumulators for extreme accuracy
  const totalSystemDeposits = clientUsers.reduce((sum, c) => sum + (c.totalReceivedUSD || 0), 0);
  const totalSystemRevenue = clientUsers.reduce((sum, c) => sum + (c.totalFeesUSD || 0), 0);
  const totalProcessedPayouts = clientUsers.reduce((sum, c) => sum + (c.totalPaidUSD || 0), 0);
  const totalSystemProfit = clientUsers.reduce((sum, c) => sum + (c.totalProfitUSD || 0), 0);
  
  // Sort clients by profit to get the top clients
  const topClients = [...clientUsers].sort((a, b) => (b.totalProfitUSD || 0) - (a.totalProfitUSD || 0)).slice(0, 5);

  const availableCount = availableData?.data?.total || 0;
  const allocatedCount = allocatedData?.data?.total || 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">A high-level view of the Payout System operations.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Total Clients"
          value={clientUsersCount}
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Available Names"
          value={availableCount}
          icon={CheckBadgeIcon}
          color="green"
        />
        <StatCard
          title="Allocated (Unclaimed)"
          value={allocatedCount}
          icon={ArrowPathIcon}
          color="yellow"
        />
        <StatCard
          title="Total Client Profit"
          value={`$${totalSystemProfit.toFixed(2)}`}
          icon={BanknotesIcon}
          color="purple"
        />
        <StatCard
          title="Platform Revenue"
          value={`$${totalSystemRevenue.toFixed(2)}`}
          icon={BanknotesIcon}
          color="purple"
        />
        <StatCard
          title="Total Paid Out"
          value={`$${totalProcessedPayouts.toFixed(2)}`}
          icon={BanknotesIcon}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Flow Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total System Deposits (Gross)</span>
              <span className="font-bold text-green-600">${totalSystemDeposits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total System Payouts (Net Outflow)</span>
              <span className="font-bold text-gray-900">${totalProcessedPayouts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Total Platform Revenue (Fees)</span>
              <span className="font-bold text-purple-600">${totalSystemRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payout Log</h3>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {transactions.slice(0, 5).map(tx => (
                <li key={tx._id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.clientId?.profile?.firstName} {tx.clientId?.profile?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold text-gray-900`}>
                      -${tx.grossAmountUSD.toFixed(2)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-gray-100 text-gray-800`}>
                      PAYOUT ({tx.payoutCurrency})
                    </span>
                  </div>
                </li>
              ))}
              {transactions.length === 0 && (
                <li className="py-3 text-center text-gray-500 text-sm">No recent transactions.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Top Clients Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2 mt-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients (By Profitability)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topClients.map((client) => (
                  <tr key={client._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {client.profile?.firstName?.[0]}{client.profile?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.profile?.firstName} {client.profile?.lastName}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${(client.totalReceivedUSD || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${(client.totalPaidUSD || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                      ${(client.totalFeesUSD || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ${(client.totalProfitUSD || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {topClients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 text-sm">
                      No client data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}