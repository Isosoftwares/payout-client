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

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['admin-virtual-accounts'],
    queryFn: () => axios.get('/virtual-accounts'),
  });

  const { data: txData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => axios.get('/transactions'),
  });

  const { data: requestsData, isLoading: isLoadingReq } = useQuery({
    queryKey: ['admin-payout-requests'],
    queryFn: () => axios.get('/transactions/payout-requests'),
  });

  if (isLoadingUsers || isLoadingAccounts || isLoadingTx || isLoadingReq) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const users = usersData?.data?.data?.users || [];
  const accounts = accountsData?.data?.data || [];
  const transactions = txData?.data?.data || [];
  const requests = requestsData?.data?.data || [];

  const clientUsersCount = users.filter(u => u.role === 'client').length;
  const activeAccountsCount = accounts.filter(a => a.status === 'active').length;
  
  const totalSystemDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.grossAmount, 0);
  const totalSystemRevenue = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.feeAmount, 0);
  const totalProcessedPayouts = transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.grossAmount, 0);
  const pendingRequestsCount = requests.filter(r => r.status === 'pending' || r.status === 'processing').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">A high-level view of the Payout System operations.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={clientUsersCount}
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Active Payout Names"
          value={`${activeAccountsCount} / ${accounts.length}`}
          icon={CheckBadgeIcon}
          color="green"
        />
        <StatCard
          title="Pending Payout Requests"
          value={pendingRequestsCount}
          icon={ArrowPathIcon}
          color="yellow"
        />
        <StatCard
          title="Total Platform Revenue"
          value={`$${totalSystemRevenue.toFixed(2)}`}
          icon={BanknotesIcon}
          color="purple"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions Log</h3>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {transactions.slice(0, 5).map(tx => (
                <li key={tx._id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.virtualAccount?.firstName} {tx.virtualAccount?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.grossAmount.toFixed(2)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                      tx.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.type}
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
      </div>
    </div>
  );
}