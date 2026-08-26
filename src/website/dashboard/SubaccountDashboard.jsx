import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function SubaccountDashboard() {
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['subaccount-inventory', searchTerm],
    queryFn: () => axios.get(`/payout-names/subaccount-inventory?search=${searchTerm}`),
    keepPreviousData: true
  });

  const claimedNames = inventoryData?.data?.data?.claimedNames || [];

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      setAuth({});
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Subaccount Portal</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Payout Names</h2>
              <p className="text-xs text-gray-500">These names have been claimed for you by your broker.</p>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acct Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Routing Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Maturity Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="6" className="p-6 text-center text-gray-500">Loading your names...</td></tr>
                ) : claimedNames.length === 0 ? (
                  <tr><td colSpan="6" className="p-6 text-center text-gray-500">No names have been assigned to you yet (or none match search).</td></tr>
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
      </main>
    </div>
  );
}
