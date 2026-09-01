import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';

export default function ProcessPayouts() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [selectedAdminId, setSelectedAdminId] = useState('all');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedNames, setSelectedNames] = useState([]);
  const [maturityDateFilter, setMaturityDateFilter] = useState('');
  
  // Execution State
  const [payoutCurrency, setPayoutCurrency] = useState('USD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const { data: adminsData } = useQuery({
    queryKey: ['payout-admins'],
    queryFn: () => axios.get('/batch-payouts/admins')
  });
  const admins = adminsData?.data?.data || [];

  const { data: clientsData } = useQuery({
    queryKey: ['payout-clients', selectedAdminId],
    queryFn: () => axios.get(`/batch-payouts/clients/${selectedAdminId}`)
  });
  const clients = clientsData?.data?.data || [];
  const selectedClient = clients.find(c => c._id === selectedClientId);

  const { data: namesData, isLoading: isLoadingNames } = useQuery({
    queryKey: ['payout-matured-names', selectedClientId],
    queryFn: () => axios.get(`/batch-payouts/matured-names/${selectedClientId}`),
    enabled: !!selectedClientId
  });
  
  // Sort by maturity date ascending (oldest first)
  const rawMaturedNames = namesData?.data?.data || [];
  const sortedNames = [...rawMaturedNames].sort((a, b) => {
    if (!a.maturityDate) return 1;
    if (!b.maturityDate) return -1;
    return new Date(a.maturityDate) - new Date(b.maturityDate);
  });
  
  // Filter by maturity date
  const maturedNames = maturityDateFilter 
    ? sortedNames.filter(n => {
        if (!n.maturityDate) return false;
        const nDate = new Date(n.maturityDate).toISOString().split('T')[0];
        return nDate === maturityDateFilter;
      })
    : sortedNames;

  const { data: adminStatsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['payout-admin-stats', selectedAdminId],
    queryFn: () => axios.get(`/batch-payouts/matured-stats/${selectedAdminId}`)
  });
  const adminStats = adminStatsData?.data?.data || { totalCount: 0, totalAmount: 0 };

  const { mutate: executePayout, isPending: isExecuting } = useMutation({
    mutationFn: (data) => axios.post('/batch-payouts/execute', data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['payout-matured-names', selectedClientId]);
      queryClient.invalidateQueries(['payout-admin-stats', selectedAdminId]);
      queryClient.invalidateQueries(['admin-payout-names']);
      setSelectedNames([]);
      setReferenceId('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to execute payout')
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNames(maturedNames.map(n => n._id));
    } else {
      setSelectedNames([]);
    }
  };

  const handleSelectName = (id) => {
    if (selectedNames.includes(id)) {
      setSelectedNames(selectedNames.filter(nId => nId !== id));
    } else {
      setSelectedNames([...selectedNames, id]);
    }
  };

  const handleClientChange = (clientId) => {
    setSelectedClientId(clientId);
    setSelectedNames([]);
    
    const client = clients.find(c => c._id === clientId);
    if (client && client.paymentMethods && client.paymentMethods.length > 0) {
      const defaultMethod = client.paymentMethods.find(pm => pm.isDefault) || client.paymentMethods[0];
      setPaymentMethodId(defaultMethod._id);
      
      if (defaultMethod.type === 'mpesa') {
        setPayoutCurrency('KES');
      } else if (defaultMethod.type === 'bank') {
        setPayoutCurrency(defaultMethod.details?.bankCurrency || 'KES');
      }
    } else {
      setPaymentMethodId('');
      setPayoutCurrency('USD');
    }
  };

  const handlePaymentMethodChange = (methodId) => {
    setPaymentMethodId(methodId);
    if (!selectedClient) return;
    
    const method = selectedClient.paymentMethods.find(pm => pm._id === methodId);
    if (method) {
      if (method.type === 'mpesa') {
        setPayoutCurrency('KES');
      } else if (method.type === 'bank') {
        setPayoutCurrency(method.details?.bankCurrency || 'KES');
      }
    }
  };

  const handleExecute = (e) => {
    e.preventDefault();
    if (selectedNames.length === 0) {
      toast.error("Please select at least one matured name.");
      return;
    }
    executePayout({
      clientId: selectedClientId,
      payoutNameIds: selectedNames,
      payoutCurrency,
      paymentMethodId,
      referenceId
    });
  };

  // Calculator Math
  const selectedRecords = maturedNames.filter(n => selectedNames.includes(n._id));
  const grossAmountUSD = selectedRecords.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const feePercentage = selectedClient?.feePercentage || 0;
  const feeAmountUSD = (grossAmountUSD * feePercentage) / 100;
  const netAmountUSD = grossAmountUSD - feeAmountUSD;
  const usdBuyPrice = selectedClient?.usdBuyPrice || 124;
  const usdSellPrice = selectedClient?.usdSellPrice || 131;
  
  let finalPayoutAmount = 0;
  let spreadProfitUSD = 0;
  if (payoutCurrency === 'KES') {
    finalPayoutAmount = netAmountUSD * usdBuyPrice;
  } else if (payoutCurrency === 'USD') {
    finalPayoutAmount = (netAmountUSD * usdBuyPrice) / usdSellPrice;
    spreadProfitUSD = netAmountUSD - finalPayoutAmount;
  }
  const totalProfitUSD = feeAmountUSD + spreadProfitUSD;

  const selectedPaymentMethod = selectedClient?.paymentMethods?.find(pm => pm._id === paymentMethodId);

  console.log(selectedClient?.paymentMethods);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Payouts</h1>
          <p className="mt-2 text-sm text-gray-700">Select matured names and execute batch payouts with automatic fee and exchange rate calculations.</p>
        </div>
        
        {/* Global Matured Stats for Admin */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-6 min-w-max">
          <div>
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              {selectedAdminId === 'all' ? 'Total (All Admins)' : 'Total (Selected Admin)'}
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {isLoadingStats ? '...' : adminStats.totalCount} <span className="text-sm font-medium text-blue-700">Matured Names</span>
            </p>
          </div>
          <div className="border-l border-blue-200 h-10 hidden sm:block"></div>
          <div>
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Total Value</p>
            <p className="text-2xl font-bold text-blue-900">
              ${isLoadingStats ? '...' : (adminStats.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Selection & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">1. Filter & Select Client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Admin (Added By)</label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => {
                    setSelectedAdminId(e.target.value);
                    setSelectedClientId('');
                    setSelectedNames([]);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Admins</option>
                  {admins.map(a => (
                    <option key={a._id} value={a._id}>{a.firstName} {a.lastName} ({a.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName} ({c.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedClientId && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-medium text-gray-900">2. Select Matured Names</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {maturedNames.length} Available
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Maturity Date</label>
                  <input
                    type="date"
                    value={maturityDateFilter}
                    onChange={(e) => {
                      setMaturityDateFilter(e.target.value);
                      setSelectedNames([]); // Clear selection on filter change
                    }}
                    className="block w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {maturityDateFilter && (
                    <button 
                      onClick={() => {
                        setMaturityDateFilter('');
                        setSelectedNames([]);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={maturedNames.length > 0 && selectedNames.length === maturedNames.length}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acct #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matured On</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingNames ? (
                      <tr><td colSpan="5" className="p-6 text-center text-sm text-gray-500">Loading names...</td></tr>
                    ) : maturedNames.length === 0 ? (
                      <tr><td colSpan="5" className="p-6 text-center text-sm text-gray-500">No matured names available for this client.</td></tr>
                    ) : (
                      maturedNames.map(name => (
                        <tr key={name._id} className={selectedNames.includes(name._id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedNames.includes(name._id)}
                              onChange={() => handleSelectName(name._id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{name.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{name.accountNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${name.amount?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(name.maturityDate).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Calculator & Execution */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-900">
              <h2 className="text-lg font-medium text-white">3. Calculator & Execution</h2>
            </div>
            
            {!selectedClientId ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Please select a client to view the calculator.
              </div>
            ) : (
              <form onSubmit={handleExecute} className="p-6 space-y-6">
                
                {/* Financial Summary */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Selected Names:</span>
                    <span className="font-medium text-gray-900">{selectedNames.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross Amount:</span>
                    <span className="font-medium text-gray-900">${grossAmountUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Fee Deduction ({feePercentage}%):</span>
                    <span>-${feeAmountUSD.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
                    <span>Net Amount (USD):</span>
                    <span>${netAmountUSD.toFixed(2)}</span>
                  </div>
                </div>

                {/* Execution Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Account</label>
                    <select
                      value={paymentMethodId}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">-- Select Saved Destination --</option>
                      {selectedClient?.paymentMethods?.map(pm => (
                        <option key={pm._id} value={pm._id}>
                          {pm.type === 'bank' ? pm.details?.bankName : pm.type.toUpperCase()} - {pm.details?.accountNumber || pm.details?.phone || pm.details?.walletAddress || 'Account'} 
                          {pm.isDefault ? ' ⭐ PREFERRED' : ''}
                        </option>
                      ))}
                    </select>

                    {selectedPaymentMethod && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                        {selectedPaymentMethod.type === 'bank' && (
                          <div className="space-y-1">
                            <p><span className="font-medium text-gray-500">Bank Name:</span> {selectedPaymentMethod.details?.bankName}</p>
                            <p><span className="font-medium text-gray-500">Account Name:</span> {selectedPaymentMethod.details?.accountName}</p>
                            <p><span className="font-medium text-gray-500">Account No:</span> {selectedPaymentMethod.details?.accountNumber}</p>
                            {selectedPaymentMethod.details?.branchCode && (
                              <p className="break-all"><span className="font-medium text-gray-500">Routing/Branch:</span> {selectedPaymentMethod.details.branchCode}</p>
                            )}
                            <p><span className="font-medium text-gray-500">Currency:</span> {selectedPaymentMethod.details?.bankCurrency || 'KES'}</p>
                          </div>
                        )}
                        {selectedPaymentMethod.type === 'mpesa' && (
                          <div className="space-y-1">
                            <p><span className="font-medium text-gray-500">Name:</span> {selectedPaymentMethod.details?.name || selectedPaymentMethod.details?.accountName}</p>
                            <p><span className="font-medium text-gray-500">Phone:</span> {selectedPaymentMethod.details?.phone}</p>
                            <p><span className="font-medium text-gray-500">Currency:</span> KES</p>
                          </div>
                        )}
                        {selectedPaymentMethod.type === 'crypto' && (
                          <div className="space-y-1">
                            <p><span className="font-medium text-gray-500">Network:</span> {selectedPaymentMethod.details?.network}</p>
                            <p className="break-all"><span className="font-medium text-gray-500">Address:</span> {selectedPaymentMethod.details?.walletAddress}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Currency (Auto-selected)</label>
                    <select
                      value={payoutCurrency}
                      onChange={(e) => setPayoutCurrency(e.target.value)}
                      disabled
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                    </select>
                  </div>

                  {/* Final Calculation Result */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 mb-1 uppercase font-semibold tracking-wide">Final Payout Amount</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {payoutCurrency === 'KES' ? 'KES ' : '$'}
                      {finalPayoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Exchange Rate: {payoutCurrency === 'KES' ? `1 USD = ${usdBuyPrice} KES (Buy)` : `Buy: ${usdBuyPrice} / Sell: ${usdSellPrice}`}
                    </p>
                  </div>
                  
                  {/* Profit Preview */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-800">Est. Total Profit (USD)</span>
                    <span className="text-sm font-bold text-green-900">${totalProfitUSD.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction/Reference ID</label>
                    <input
                      type="text"
                      required
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. TRN-928374"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isExecuting || selectedNames.length === 0}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isExecuting ? 'Processing...' : 'Execute Payout'}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
