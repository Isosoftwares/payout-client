import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function FeeLedger() {
  const axios = useAxiosPrivate();
  const [reportType, setReportType] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: txData, isLoading } = useQuery({
    queryKey: ['fee-ledger-transactions'],
    queryFn: () => axios.get('/batch-payouts/transactions?limit=all'),
    onError: () => toast.error('Failed to load ledger transactions'),
  });

  const transactions = txData?.data?.data || [];

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  };

  const aggregatedFees = useMemo(() => {
    let filtered = transactions.filter(tx => {
      const clientName = `${tx.clientId?.profile?.firstName || ''} ${tx.clientId?.profile?.lastName || ''}`.toLowerCase();
      const email = (tx.clientId?.email || '').toLowerCase();
      
      if (searchTerm && !clientName.includes(searchTerm.toLowerCase()) && !email.includes(searchTerm.toLowerCase())) return false;
      
      const txDate = new Date(tx.createdAt);
      if (startDate && txDate < new Date(startDate)) return false;
      if (endDate && txDate > new Date(endDate)) return false;
      
      return true;
    });

    const grouped = {};
    
    filtered.forEach(tx => {
      const date = new Date(tx.createdAt);
      let periodKey = '';
      let sortKey = 0;
      
      if (reportType === 'daily') {
        periodKey = date.toISOString().split('T')[0];
        sortKey = date.getTime();
      } else if (reportType === 'weekly') {
        const week = getWeekNumber(date);
        periodKey = `${date.getFullYear()} - Week ${week}`;
        sortKey = date.getFullYear() * 100 + week;
      } else if (reportType === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        sortKey = date.getFullYear() * 100 + date.getMonth();
      } else if (reportType === 'yearly') {
        periodKey = `${date.getFullYear()}`;
        sortKey = date.getFullYear();
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          period: periodKey,
          sortKey: sortKey,
          totalGrossUSD: 0,
          totalFeeUSD: 0,
          totalProfitUSD: 0,
          count: 0
        };
      }
      
      grouped[periodKey].totalGrossUSD += tx.grossAmountUSD || 0;
      grouped[periodKey].totalFeeUSD += tx.feeAmountUSD || 0;
      grouped[periodKey].totalProfitUSD += tx.totalProfitUSD || 0;
      grouped[periodKey].count += 1;
    });

    return Object.values(grouped).sort((a, b) => b.sortKey - a.sortKey);
  }, [transactions, reportType, startDate, endDate, searchTerm]);

  const handleExportCSV = () => {
    if (aggregatedFees.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const headers = ['Period', 'Total Gross (USD)', 'Total Fees (USD)', 'Total Profit (USD)', 'Transaction Count'];
    const rows = aggregatedFees.map(f => [
      f.period,
      f.totalGrossUSD.toFixed(2),
      f.totalFeeUSD.toFixed(2),
      f.totalProfitUSD.toFixed(2),
      f.count
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Fee_Ledger_Report_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [...aggregatedFees].reverse(); // Ascending for chart

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Ledger & Profit Analysis</h1>
          <p className="mt-2 text-sm text-gray-700">Track commission and spread profit earned from processed payouts over time.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Export to CSV / Excel
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Client</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grouping Period</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend ({reportType.charAt(0).toUpperCase() + reportType.slice(1)})</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalFeeUSD" name="Fee Revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="totalProfitUSD" name="Total Profit (Inc. Spread)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Period</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Gross Handled</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fees Collected</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Profit (inc. Spread)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading ledger data...</td></tr>
              ) : aggregatedFees.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No data found for the selected criteria.</td></tr>
              ) : (
                aggregatedFees.map((fee, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                      {fee.period}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      ${fee.totalGrossUSD.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                      ${fee.totalFeeUSD.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-green-600">
                      ${fee.totalProfitUSD.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {fee.count}
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
