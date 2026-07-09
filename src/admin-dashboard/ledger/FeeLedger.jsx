import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function FeeLedger() {
  const axios = useAxiosPrivate();
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['fee-ledger'],
    queryFn: () => axios.get('/transactions/fee-ledger'),
    onError: () => toast.error('Failed to load ledger'),
  });

  const fees = ledgerData?.data?.data || [];

  const aggregatedFees = useMemo(() => {
    let filtered = fees.filter(fee => {
      const clientName = (fee._id.client || '').toLowerCase();
      if (searchTerm && !clientName.includes(searchTerm.toLowerCase())) return false;
      
      const feeDate = new Date(fee._id.year, fee._id.month - 1, fee._id.day);
      if (startDate && feeDate < new Date(startDate)) return false;
      if (endDate && feeDate > new Date(endDate)) return false;
      
      return true;
    });

    if (reportType === 'daily') {
      return filtered.map(fee => ({
        period: `${fee._id.year}-${String(fee._id.month).padStart(2, '0')}-${String(fee._id.day).padStart(2, '0')}`,
        client: fee._id.client,
        totalGross: fee.totalGross,
        totalFee: fee.totalFee,
        count: fee.count
      }));
    }

    // Grouping for weekly/monthly
    const grouped = {};
    filtered.forEach(fee => {
      let key;
      if (reportType === 'weekly') {
        key = `Week ${fee._id.week}, ${fee._id.year} - ${fee._id.client}`;
      } else if (reportType === 'monthly') {
        key = `${fee._id.year}-${String(fee._id.month).padStart(2, '0')} - ${fee._id.client}`;
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          period: reportType === 'weekly' ? `Week ${fee._id.week}, ${fee._id.year}` : `${fee._id.year}-${String(fee._id.month).padStart(2, '0')}`,
          client: fee._id.client,
          totalGross: 0,
          totalFee: 0,
          count: 0
        };
      }
      grouped[key].totalGross += fee.totalGross;
      grouped[key].totalFee += fee.totalFee;
      grouped[key].count += fee.count;
    });

    return Object.values(grouped).sort((a, b) => b.period.localeCompare(a.period));
  }, [fees, reportType, startDate, endDate, searchTerm]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Revenue Ledger Reports</h1>
          <p className="mt-2 text-sm text-gray-700">Track and report the percentage cuts taken from client deposits over time.</p>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Client</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="daily">Daily (Detailed)</option>
              <option value="weekly">Weekly Summary</option>
              <option value="monthly">Monthly Summary</option>
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

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Gross Received</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Platform Revenue (Fee)</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total TXNs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                  ) : aggregatedFees.length === 0 ? (
                    <tr><td colSpan="5" className="p-4 text-center">No fee data found for the selected criteria.</td></tr>
                  ) : (
                    aggregatedFees.map((fee, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                          {fee.period}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{fee.client}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">${fee.totalGross.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-green-600">${fee.totalFee.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{fee.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
