import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import {
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export default function DailyReportView({ isAdmin = false }) {
  const axios = useAxiosPrivate();

  // Get today's local date as YYYY-MM-DD
  const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [dateType, setDateType] = useState('received'); // 'received' or 'maturity'
  const [selectedClient, setSelectedClient] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100); // min 100, max 1000
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch client list for admin client filter
  const { data: clientsData } = useQuery({
    queryKey: ['admin-clients-dropdown-report'],
    queryFn: () => axios.get('/users?role=client&limit=1000'),
    enabled: isAdmin,
  });
  const clients = clientsData?.data?.data?.users || [];

  // Fetch daily report
  const {
    data: reportData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['daily-report', selectedDate, dateType, selectedClient, paymentStatusFilter, page, limit],
    queryFn: () => {
      const clientParam = isAdmin && selectedClient !== 'all' ? `&clientId=${selectedClient}` : '';
      const statusParam = paymentStatusFilter !== 'all' ? `&paymentStatus=${paymentStatusFilter}` : '';
      return axios.get(`/reports/daily?date=${selectedDate}&dateType=${dateType}${clientParam}${statusParam}&page=${page}&limit=${limit}`);
    },
    keepPreviousData: true,
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to load daily report');
    },
  });

  const report = reportData?.data?.data || {};
  const records = report.records || [];
  const totalCount = report.totalCount || 0;
  const totalAmount = report.totalAmount || 0;
  const totalPages = report.pages || 1;

  // Set quick date helpers
  const handleQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setPage(1);
  };

  // CSV Export
  const handleDownloadCSV = async () => {
    try {
      setIsDownloading(true);
      const clientParam = isAdmin && selectedClient !== 'all' ? `&clientId=${selectedClient}` : '';
      const statusParam = paymentStatusFilter !== 'all' ? `&paymentStatus=${paymentStatusFilter}` : '';
      const res = await axios.get(
        `/reports/daily?date=${selectedDate}&dateType=${dateType}${clientParam}${statusParam}&all=true`
      );

      const allRecords = res?.data?.data?.records || [];
      if (allRecords.length === 0) {
        toast.info('No records available to export for this selection.');
        setIsDownloading(false);
        return;
      }

      const headers = [
        'Payout Name',
        'Routing Number',
        'Account Number',
        ...(isAdmin ? ['Client Name', 'Client Email'] : []),
        'Subaccount',
        'Amount (USD)',
        'Payment Status',
        'Payment Received Date',
        'Maturity Date',
      ];

      const rows = allRecords.map((item) => {
        const clientName = item.allocatedTo?.profile?.companyName ||
          [item.allocatedTo?.profile?.firstName, item.allocatedTo?.profile?.lastName].filter(Boolean).join(' ') ||
          '';
        const clientEmail = item.allocatedTo?.email || '';
        const subaccount = item.claimedForSubaccount?.username || 'Self';
        const amount = item.amount ? item.amount.toFixed(2) : '0.00';
        const status = item.paymentStatus || 'not_received';
        const receivedDate = item.paymentReceivedDate ? new Date(item.paymentReceivedDate).toISOString().split('T')[0] : '';
        const maturityDate = item.maturityDate ? new Date(item.maturityDate).toISOString().split('T')[0] : '';

        const escapeCSV = (val) => {
          const str = String(val ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        };

        const row = [
          escapeCSV(item.name),
          escapeCSV(item.routingNumber),
          escapeCSV(item.accountNumber),
          ...(isAdmin ? [escapeCSV(clientName), escapeCSV(clientEmail)] : []),
          escapeCSV(subaccount),
          escapeCSV(amount),
          escapeCSV(status),
          escapeCSV(receivedDate),
          escapeCSV(maturityDate),
        ];

        return row.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `daily_report_${selectedDate}_${dateType}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${allRecords.length} records successfully!`);
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast.error('Failed to export daily report');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date and Quick buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-3 py-2 text-sm font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 bg-white"
              />
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleQuickDate(-1)}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(0)}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* Date Type Toggle (Received vs Maturing) */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setDateType('received');
                setPage(1);
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                dateType === 'received'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircleIcon className={`h-4 w-4 ${dateType === 'received' ? 'text-primary' : 'text-gray-400'}`} />
              <span>Payments Received</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDateType('maturity');
                setPage(1);
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                dateType === 'maturity'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClockIcon className={`h-4 w-4 ${dateType === 'maturity' ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span>Payments Maturing</span>
            </button>
          </div>

          {/* Action: CSV Download */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={isDownloading || totalCount === 0}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{isDownloading ? 'Exporting...' : 'Download CSV'}</span>
            </button>
          </div>
        </div>

        {/* Secondary filters row (Client & Payment Status & Limit) */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Admin Client Dropdown */}
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500">Client:</span>
                <select
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setPage(1);
                  }}
                  className="py-1.5 px-3 text-xs md:text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-primary focus:border-primary text-gray-800"
                >
                  <option value="all">All Clients</option>
                  {clients.map((c) => {
                    const label = c.profile?.companyName
                      ? `${c.profile.companyName} (${c.email})`
                      : c.email;
                    return (
                      <option key={c._id} value={c._id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Payment Status Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500">Payment Status:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-1.5 px-3 text-xs md:text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-primary focus:border-primary text-gray-800"
              >
                <option value="all">All Statuses</option>
                <option value="received">Received</option>
                <option value="matured">Matured</option>
                <option value="paid">Paid</option>
                <option value="not_received">Not Received</option>
              </select>
            </div>
          </div>

          {/* Items Per Page (min 100 max 1000) */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500">Per Page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="py-1.5 px-2 text-xs md:text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-primary focus:border-primary text-gray-800"
            >
              <option value="100">100 (Default)</option>
              <option value="250">250</option>
              <option value="500">500</option>
              <option value="1000">1000 (Max)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards / Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Amount USD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <BanknotesIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Amount {dateType === 'received' ? 'Received' : 'Maturing'}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Records Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <DocumentTextIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Records
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {totalCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Active Criteria Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <CalendarDaysIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Selected Target Date
            </p>
            <p className="text-base font-bold text-gray-900 mt-0.5">
              {formatDateDisplay(selectedDate)}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              Filter: {dateType === 'received' ? 'Payments Received' : 'Payments Maturing'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            {dateType === 'received' ? 'Received Payments List' : 'Maturing Payments List'}
          </h2>
          {isFetching && (
            <span className="text-xs font-medium text-primary flex items-center space-x-1">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
              <span>Updating...</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payout Name
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subaccount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Routing Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount (USD)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Received Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Maturity Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 10 : 9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      <p className="text-sm font-medium">Loading report records...</p>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 10 : 9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <CalendarDaysIcon className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">
                        No payments found for {formatDateDisplay(selectedDate)} (
                        {dateType === 'received' ? 'received date' : 'maturity date'}).
                      </p>
                      <p className="text-xs text-gray-400">
                        Try selecting another date or adjusting filters above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((item, idx) => {
                  const rowNumber = (page - 1) * limit + idx + 1;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {rowNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          {item.name}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {item.allocatedTo ? (
                            <div>
                              <p className="font-medium text-gray-800">
                                {item.allocatedTo.profile?.companyName ||
                                  [item.allocatedTo.profile?.firstName, item.allocatedTo.profile?.lastName]
                                    .filter(Boolean)
                                    .join(' ') ||
                                  '—'}
                              </p>
                              <p className="text-gray-500 font-mono text-[11px]">
                                {item.allocatedTo.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-700">
                        {item.claimedForSubaccount?.username ? (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                            {item.claimedForSubaccount.username}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Self</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {item.accountNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {item.routingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                        ${item.amount ? item.amount.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                            item.paymentStatus === 'received'
                              ? 'bg-blue-100 text-blue-800'
                              : item.paymentStatus === 'matured'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.paymentStatus === 'paid'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.paymentStatus
                            ? item.paymentStatus.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                            : 'Not Received'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatDateDisplay(item.paymentReceivedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {item.maturityDate ? (
                          <div className="flex flex-col">
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full border text-xs w-max ${
                                dateType === 'maturity'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {formatDateDisplay(item.maturityDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Wide Pagination Footer (min 100 max 1000) */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600">
            Showing{' '}
            <span className="font-semibold text-gray-900">
              {totalCount === 0 ? 0 : (page - 1) * limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(page * limit, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-gray-900">{totalCount}</span> records
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="text-xs text-gray-700 px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
