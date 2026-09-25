import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import PayoutNameLogsModal from '../../components/PayoutNameLogsModal';

export default function PayoutNames() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSpecificRequestModal, setShowSpecificRequestModal] = useState(false);
  const [historyTab, setHistoryTab] = useState('specific'); // 'specific' or 'bulk'
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [specificPage, setSpecificPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [subaccountFilter, setSubaccountFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [claimBatchFilter, setClaimBatchFilter] = useState('');
  const [selectedNames, setSelectedNames] = useState(new Set());
  const [selectedPayoutNameForLogs, setSelectedPayoutNameForLogs] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerSpecific, handleSubmit: handleSpecificSubmit, reset: resetSpecific, formState: { errors: specificErrors } } = useForm();

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['client-inventory', searchTerm, subaccountFilter, paymentStatusFilter],
    queryFn: () => axios.get(`/payout-names/my-inventory?search=${searchTerm}&subaccount=${subaccountFilter}&paymentStatus=${paymentStatusFilter}`),
    keepPreviousData: true,
  });

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['client-allocation-requests', page, limit],
    queryFn: () => axios.get(`/payout-names/requests/me?page=${page}&limit=${limit}`),
    keepPreviousData: true,
    onError: (err) => toast.error('Failed to load requests'),
  });

  const { data: specificRequestsData, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['client-specific-requests', specificPage],
    queryFn: () => axios.get(`/payout-names/specific-requests/me?page=${specificPage}&limit=6`),
    keepPreviousData: true,
  });

  const { data: subaccountsData } = useQuery({
    queryKey: ['subaccounts'],
    queryFn: () => axios.get('/subaccounts'),
  });

  const subaccounts = subaccountsData?.data?.data || [];

  const requests = requestsData?.data?.data || [];
  const totalPages = requestsData?.data?.pages || 1;
  const totalItems = requestsData?.data?.total || 0;

  const specificRequests = specificRequestsData?.data?.data || [];
  const totalSpecificPages = specificRequestsData?.data?.pages || 1;
  const totalSpecificItems = specificRequestsData?.data?.total || 0;

  const allocatedCount = inventoryData?.data?.data?.allocatedCount || 0;
  const claimedNames = inventoryData?.data?.data?.claimedNames || [];

  const { data: quotaData } = useQuery({
    queryKey: ['client-self-allocation-quota'],
    queryFn: () => axios.get('/payout-names/self-allocation-quota'),
  });
  const quotaInfo = quotaData?.data?.data || null;

  const { mutate: requestAllocation, isPending: isRequesting } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/request', data),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Allocation request processed successfully');
      queryClient.invalidateQueries(['client-allocation-requests']);
      queryClient.invalidateQueries(['client-inventory']);
      queryClient.invalidateQueries(['client-self-allocation-quota']);
      setShowRequestModal(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to request allocation'),
  });

  const { mutate: requestSpecificName, isPending: isRequestingSpecific } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/specific-request', data),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Specific name requested successfully');
      queryClient.invalidateQueries(['client-specific-requests']);
      setShowSpecificRequestModal(false);
      resetSpecific();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to request specific name'),
  });

  const [showClaimModal, setShowClaimModal] = useState(false);
  const { register: registerClaim, handleSubmit: handleClaimSubmit, reset: resetClaim, formState: { errors: claimErrors } } = useForm();

  const { mutate: claimNames, isPending: isClaiming } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/claim', data),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Names claimed successfully');
      queryClient.invalidateQueries(['client-inventory']);
      setShowClaimModal(false);
      resetClaim();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to claim names'),
  });

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSpecificPageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalSpecificPages) {
      setSpecificPage(newPage);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNames(new Set(claimedNames.map(n => n._id)));
    } else {
      setSelectedNames(new Set());
    }
  };

  const handleSelectName = (id) => {
    const newSelected = new Set(selectedNames);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNames(newSelected);
  };

  // Group claimed names into distinct batches (most recent claim first, unknown claim date last)
  const batches = useMemo(() => {
    const map = new Map();

    claimedNames.forEach((pn) => {
      let batchKey = 'unknown';
      let batchDate = null;
      let batchTitle = 'Unknown Claim Date (Legacy Batch)';

      if (pn.claimedAt) {
        batchDate = new Date(pn.claimedAt);
        batchKey = pn.claimBatchId || `time_${batchDate.toISOString().substring(0, 16)}`;
        batchTitle = batchDate.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      if (!map.has(batchKey)) {
        map.set(batchKey, {
          key: batchKey,
          title: batchTitle,
          date: batchDate,
          isUnknown: !batchDate,
          names: [],
        });
      }
      map.get(batchKey).names.push(pn);
    });

    const batchList = Array.from(map.values());
    batchList.sort((a, b) => {
      if (a.isUnknown && !b.isUnknown) return 1;
      if (!a.isUnknown && b.isUnknown) return -1;
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return 0;
    });

    return batchList;
  }, [claimedNames]);

  // Filtered batches based on claimBatchFilter
  const displayedBatches = useMemo(() => {
    if (!claimBatchFilter) return batches;
    return batches.filter((b) => b.key === claimBatchFilter);
  }, [batches, claimBatchFilter]);

  const downloadCSV = (namesToDownload, filename = 'payout_names.csv') => {
    if (!namesToDownload || namesToDownload.length === 0) {
      toast.info('No names available to download.');
      return;
    }

    const headers = [
      'Name',
      'Account Number',
      'Routing Number',
      'Claimed For',
      'Claimed Date',
      'Amount',
      'Payment Status',
      'Maturity Date'
    ];

    const formatTextCell = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      if (!str) return '';
      return `="` + str.replace(/"/g, '""') + `"`;
    };

    const escapeCSV = (val) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const rows = namesToDownload.map((name) => [
      escapeCSV(name.name || ''),
      formatTextCell(name.accountNumber),
      formatTextCell(name.routingNumber),
      escapeCSV(name.claimedForSubaccount ? (name.claimedForSubaccount.username || 'Subaccount') : 'Self'),
      escapeCSV(name.claimedAt ? new Date(name.claimedAt).toLocaleString() : 'Unknown'),
      escapeCSV(name.amount || 0),
      escapeCSV(name.paymentStatus || 'not_received'),
      escapeCSV(name.maturityDate ? new Date(name.maturityDate).toLocaleDateString('en-CA', { timeZone: 'UTC' }) : 'N/A')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`Downloaded ${namesToDownload.length} name(s) in CSV`);
  };

  const downloadBatch = (batch) => {
    const safeTitle = batch.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadCSV(batch.names, `payout_names_${safeTitle}.csv`);
  };

  const downloadNames = () => {
    if (selectedNames.size > 0) {
      const selected = claimedNames.filter((n) => selectedNames.has(n._id));
      downloadCSV(selected, 'payout_names_selected.csv');
      return;
    }

    if (claimBatchFilter) {
      const currentBatch = displayedBatches[0];
      if (currentBatch) {
        downloadBatch(currentBatch);
        return;
      }
    }

    downloadCSV(claimedNames, 'payout_names_all.csv');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header and Stats */}
      <div className="sm:flex sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Names Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Request allocations, track your approvals, and claim names to reveal banking details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-4 items-center">
          <div className="px-4 py-2 bg-white text-primary rounded-lg font-medium border border-primary shadow-sm">
            Unclaimed Available: {allocatedCount}
          </div>
          <button
            onClick={() => setShowClaimModal(true)}
            disabled={allocatedCount === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/80 disabled:bg-gray-300 whitespace-nowrap text-sm shadow-sm transition-colors"
          >
            Claim Names
          </button>
          <button
            onClick={() => setShowSpecificRequestModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 whitespace-nowrap text-sm shadow-sm transition-colors"
          >
            Request Specific Name
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap text-sm shadow-sm transition-colors"
          >
            Request Bulk Allocation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
        
        {/* Claimed Names Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Claimed Names (Active)</h2>
              <p className="text-xs text-gray-500">These are your ready-to-use payout details.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={subaccountFilter}
                onChange={(e) => setSubaccountFilter(e.target.value)}
                className="block w-full sm:w-36 px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Accounts</option>
                <option value="self">Self (Main)</option>
                {subaccounts.map(sa => (
                  <option key={sa._id} value={sa._id}>{sa.username}</option>
                ))}
              </select>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
              >
                <option value="">All Payment Statuses</option>
                <option value="received">Received</option>
                <option value="matured">Matured</option>
                <option value="paid">Paid</option>
                <option value="not_received">Not Received</option>
              </select>
              <select
                value={claimBatchFilter}
                onChange={(e) => setClaimBatchFilter(e.target.value)}
                className="block w-full sm:w-44 px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
              >
                <option value="">All Batches ({claimedNames.length})</option>
                {batches.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.title} ({b.names.length})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search name or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={downloadNames}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 whitespace-nowrap text-sm shadow-sm transition-colors"
              >
                {selectedNames.size > 0
                  ? `Download Selected (${selectedNames.size})`
                  : claimBatchFilter
                  ? `Download Batch (${displayedBatches[0]?.names.length || 0})`
                  : `Download All (${claimedNames.length})`}
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={claimedNames.length > 0 && selectedNames.size === claimedNames.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acct Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Routing Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Claimed For</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Claimed Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Maturity Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingInventory ? (
                  <tr><td colSpan="10" className="p-6 text-center text-gray-500">Loading inventory...</td></tr>
                ) : displayedBatches.length === 0 ? (
                  <tr><td colSpan="10" className="p-6 text-center text-gray-500">You haven't claimed any names yet (or none match search/filter).</td></tr>
                ) : (
                  displayedBatches.map((batch) => (
                    <React.Fragment key={batch.key}>
                      {/* Batch Header Row */}
                      <tr className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 border-y border-blue-200/80">
                        <td colSpan="10" className="px-6 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="p-1 rounded bg-blue-600 text-white shadow-xs">
                                <CalendarDaysIcon className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-gray-900 tracking-tight">
                                {batch.isUnknown ? '🔒 ' : '📅 '}Batch: {batch.title}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                {batch.names.length} {batch.names.length === 1 ? 'name' : 'names'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadBatch(batch)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 shadow-xs transition-all active:scale-95"
                              title="Download this specific batch as CSV"
                            >
                              <ArrowDownTrayIcon className="w-3 h-3 text-blue-600" />
                              <span>Download Batch CSV</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Batch Names Rows */}
                      {batch.names.map((name) => (
                        <tr key={name._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                              checked={selectedNames.has(name._id)}
                              onChange={() => handleSelectName(name._id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {name.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {name.accountNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {name.routingNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {name.claimedForSubaccount ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {name.claimedForSubaccount.username}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Self
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                            {name.claimedAt ? (
                              <span className="font-medium text-gray-800">
                                {new Date(name.claimedAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Legacy / Unknown</span>
                            )}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {name.paymentStatus === 'received' && name.maturityDate ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs w-max">
                                  {new Date(name.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-blue-600 font-medium mt-0.5">Maturing</span>
                              </div>
                            ) : name.paymentStatus === 'matured' && name.maturityDate ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 text-xs w-max">
                                  {new Date(name.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-green-600 font-medium mt-0.5">Matured</span>
                              </div>
                            ) : name.maturityDate ? (
                              <span className="text-xs text-gray-600">
                                {new Date(name.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              type="button"
                              onClick={() => setSelectedPayoutNameForLogs(name)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-xs"
                              title="View Activity Logs & Narration"
                            >
                              <DocumentTextIcon className="w-3.5 h-3.5" />
                              <span>Logs</span>
                            </button>
                          </td> */}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Requests History</h2>
              <p className="text-xs text-gray-500">Track the status of your specific and bulk requests.</p>
            </div>
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setHistoryTab('specific')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  historyTab === 'specific'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Specific Names
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('bulk')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  historyTab === 'bulk'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bulk Allocations
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {historyTab === 'specific' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingSpecific ? (
                    <tr><td colSpan="4" className="p-6 text-center text-gray-500">Loading specific requests...</td></tr>
                  ) : specificRequests.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-gray-500">No specific name requests yet. Click "Request Specific Name" to start!</td></tr>
                  ) : (
                    specificRequests.map(req => (
                      <tr key={req._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {req.requestedName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {req.subaccount ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              Subaccount: {req.subaccount.username}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              Self (Main)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            req.status === 'approved' ? 'bg-green-100 text-green-800' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                          {req.status === 'rejected' && req.adminNote && (
                            <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={req.adminNote}>
                              Reason: {req.adminNote}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested Count</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingRequests ? (
                    <tr><td colSpan="3" className="p-6 text-center text-gray-500">Loading requests...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-gray-500">No requests found.</td></tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {req.requestedCount}
                          {req.status === 'approved' && req.allocatedCount !== req.requestedCount && (
                            <span className="text-gray-500 ml-1">(Granted: {req.allocatedCount})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            req.status === 'approved' ? 'bg-green-100 text-green-800' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                          {req.isSelfAllocated && (
                            <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200" title={req.adminNote}>
                              ⚡ Auto
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination bar for requests card */}
          {historyTab === 'specific' && totalSpecificPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-600">Page {specificPage} of {totalSpecificPages}</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => handleSpecificPageChange(specificPage - 1)}
                  disabled={specificPage === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handleSpecificPageChange(specificPage + 1)}
                  disabled={specificPage === totalSpecificPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {historyTab === 'bulk' && totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-600">Page {page} of {totalPages}</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Specific Name Request Modal */}
      {showSpecificRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Request Specific Payout Name</h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter the exact name you want. Once confirmed with bank details by an admin, it will be added directly to your claimed inventory.
            </p>
            <form onSubmit={handleSpecificSubmit((d) => requestSpecificName(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Requested Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  placeholder="e.g. Acme Global Services"
                  {...registerSpecific('requestedName', { 
                    required: "Name is required", 
                    minLength: { value: 2, message: "Minimum 2 characters" } 
                  })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                />
                {specificErrors.requestedName && (
                  <span className="text-xs text-red-500 mt-1 block">{specificErrors.requestedName.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To (Subaccount) <span className="text-red-500">*</span></label>
                <select
                  {...registerSpecific('subaccountId')}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="self">Self (Main Account)</option>
                  {subaccounts.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      Subaccount: {sub.username}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Select whether this name is for yourself or one of your subaccounts.</p>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowSpecificRequestModal(false); resetSpecific(); }} 
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isRequestingSpecific} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                >
                  {isRequestingSpecific ? 'Submitting Request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2">Request Payout Names</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the number of names you want to request allocation for.</p>

            {/* Quota Banner */}
            {quotaInfo && quotaInfo.dailyLimit > 0 ? (
              <div className="mb-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <BoltIcon className="w-4 h-4 text-blue-600" />
                    Daily Self-Allocation Quota
                  </span>
                  <span className="bg-blue-600 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {quotaInfo.remainingToday} remaining today
                  </span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your daily quota: <strong>{quotaInfo.dailyLimit} names/day</strong> ({quotaInfo.usedToday} used today).
                  Requests up to <strong>{quotaInfo.remainingToday}</strong> will be <strong>self-allocated immediately</strong>! Any excess will be queued for Admin approval.
                </p>
              </div>
            ) : quotaInfo ? (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                ℹ️ All requests are submitted directly to the Admin for approval.
              </div>
            ) : null}

            <form onSubmit={handleSubmit((d) => requestAllocation(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Quantity Requested <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="1"
                  {...register('requestedCount', { required: true, min: 1 })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {errors.requestedCount && <span className="text-xs text-red-500">Please enter a valid number.</span>}
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isRequesting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isRequesting ? 'Requesting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Claim Allocated Names</h2>
            <p className="text-sm text-gray-500 mb-4">
              You currently have <strong className="text-gray-900">{allocatedCount}</strong> names allocated to you. 
              How many would you like to claim right now to reveal their banking details?
            </p>
            <form onSubmit={handleClaimSubmit((d) => claimNames(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Quantity to Claim <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="1"
                  max={allocatedCount}
                  {...registerClaim('count', { 
                    required: "Required", 
                    min: { value: 1, message: "Minimum 1" },
                    max: { value: allocatedCount, message: `Maximum ${allocatedCount}` }
                  })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {claimErrors.count && <span className="text-xs text-red-500">{claimErrors.count.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium">Claim For <span className="text-red-500">*</span></label>
                <select
                  {...registerClaim('subaccountId')}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white"
                >
                  <option value="self">Self (Main Account)</option>
                  {subaccounts.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      Subaccount: {sub.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => { setShowClaimModal(false); resetClaim(); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isClaiming} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-yellow-600">
                  {isClaiming ? 'Claiming...' : 'Claim Names'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PayoutNameLogsModal
        isOpen={!!selectedPayoutNameForLogs}
        onClose={() => setSelectedPayoutNameForLogs(null)}
        payoutNameId={selectedPayoutNameForLogs?._id}
        payoutNameTitle={selectedPayoutNameForLogs?.name}
      />
    </div>
  );
}
