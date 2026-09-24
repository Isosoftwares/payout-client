import React, { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  BoltIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  FunnelIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import PayoutNameLogsModal from "../../components/PayoutNameLogsModal";

export default function ClientPayoutNamesTab({
  clientName,
  payoutNames = [],
  isLoadingNames = false,
  subaccounts = [],
  allocatedCount = 0,
  onOpenDirectClaim,
  onOpenCreateSpecific,
  onOpenUploadBacklog,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subaccountFilter, setSubaccountFilter] = useState("all");
  const [backlogFilter, setBacklogFilter] = useState("all");
  const [claimBatchFilter, setClaimBatchFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedPayoutNameForLogs, setSelectedPayoutNameForLogs] = useState(null);

  // Filtered names based on search and filters
  const filteredNames = useMemo(() => {
    return payoutNames.filter((name) => {
      // Search filter
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const matchesName = name.name?.toLowerCase().includes(term);
        const matchesAccount = name.accountNumber?.toLowerCase().includes(term);
        const matchesRouting = name.routingNumber?.toLowerCase().includes(term);
        if (!matchesName && !matchesAccount && !matchesRouting) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "claimed" && name.status !== "claimed") return false;
        if (statusFilter === "allocated" && name.status !== "allocated") return false;
        if (statusFilter === "paid" && name.paymentStatus !== "paid") return false;
        if (statusFilter === "matured" && name.paymentStatus !== "matured") return false;
        if (statusFilter === "received" && name.paymentStatus !== "received") return false;
      }

      // Subaccount filter
      if (subaccountFilter !== "all") {
        if (subaccountFilter === "self") {
          if (name.claimedForSubaccount) return false;
        } else {
          const subId = name.claimedForSubaccount?._id || name.claimedForSubaccount;
          if (subId !== subaccountFilter) return false;
        }
      }

      // Backlog filter
      if (backlogFilter === "regular" && name.isBacklog) return false;
      if (backlogFilter === "backlog" && !name.isBacklog) return false;
      if (backlogFilter === "backlog_hidden" && (!name.isBacklog || name.paymentStatus !== "not_received")) return false;
      if (backlogFilter === "backlog_visible" && (!name.isBacklog || name.paymentStatus === "not_received")) return false;

      return true;
    });
  }, [payoutNames, searchTerm, statusFilter, subaccountFilter, backlogFilter]);

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredNames.map((n) => n._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Group filtered names into batches (most recent first, unknown claim date last)
  const batches = useMemo(() => {
    const map = new Map();

    filteredNames.forEach((pn) => {
      let batchKey = "unknown";
      let batchDate = null;
      let batchTitle = "Unknown Claim Date (Legacy Batch)";

      if (pn.claimedAt) {
        batchDate = new Date(pn.claimedAt);
        batchKey = pn.claimBatchId || `time_${batchDate.toISOString().substring(0, 16)}`;
        batchTitle = batchDate.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
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
  }, [filteredNames]);

  // Filtered batches based on claimBatchFilter
  const displayedBatches = useMemo(() => {
    if (claimBatchFilter === "all") return batches;
    return batches.filter((b) => b.key === claimBatchFilter);
  }, [batches, claimBatchFilter]);

  // CSV Export logic
  const handleDownloadCSV = (onlySelected = false, customNames = null, customSuffix = "") => {
    let namesToExport = customNames || filteredNames;
    if (!customNames && (onlySelected || selectedIds.size > 0)) {
      namesToExport = filteredNames.filter((n) => selectedIds.has(n._id));
    } else if (!customNames && claimBatchFilter !== "all") {
      const selectedBatch = displayedBatches[0];
      if (selectedBatch) {
        namesToExport = selectedBatch.names;
      }
    }

    if (namesToExport.length === 0) {
      toast.info("No payout names to export.");
      return;
    }

    const headers = [
      "Payout Name",
      "Account Number",
      "Routing Number",
      "Status",
      "Backlog Status",
      "Claimed For (Subaccount)",
      "Claimed Date",
      "Amount ($)",
      "Payment Status",
      "Maturity Date",
    ];

    const rows = namesToExport.map((pn) => {
      const subLabel = pn.claimedForSubaccount?.username
        ? pn.claimedForSubaccount.username
        : "Main Account (Self)";
      const matDate = pn.maturityDate
        ? new Date(pn.maturityDate).toISOString().split('T')[0]
        : "N/A";
      const backlogStatus = pn.isBacklog
        ? (pn.paymentStatus === 'not_received' ? 'Backlog (Hidden)' : 'Backlog (Visible)')
        : 'Regular';
      const claimDate = pn.claimedAt
        ? new Date(pn.claimedAt).toLocaleString()
        : "Unknown / Legacy";
      return [
        pn.name || "",
        pn.accountNumber || "",
        pn.routingNumber || "",
        pn.status || "",
        backlogStatus,
        subLabel,
        claimDate,
        (pn.amount || 0).toFixed(2),
        pn.paymentStatus || "not_received",
        matDate,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (clientName || "client").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const fileSuffix = customSuffix ? `_${customSuffix}` : "";
    link.setAttribute("href", url);
    link.setAttribute("download", `${safeName}_payout_names${fileSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${namesToExport.length} payout name(s) to CSV`);
  };

  const handleDownloadBatch = (batch) => {
    const safeTitle = batch.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    handleDownloadCSV(false, batch.names, safeTitle);
  };

  const isAllSelected =
    filteredNames.length > 0 && selectedIds.size === filteredNames.length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Client Payout Names</h3>
              <p className="text-xs text-gray-500">
                Direct claim, create specific names, filter, and export for {clientName || "this client"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenDirectClaim}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all space-x-2"
          >
            <BoltIcon className="w-4 h-4" />
            <span>Direct Claim Names</span>
          </button>

          <button
            onClick={onOpenCreateSpecific}
            className="inline-flex items-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-green-500/20 transition-all space-x-2"
          >
            <TagIcon className="w-4 h-4" />
            <span>Add Specific Name</span>
          </button>

          <button
            onClick={onOpenUploadBacklog}
            className="inline-flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all space-x-2"
          >
            <CloudArrowUpIcon className="w-4 h-4" />
            <span>Upload Backlog Names</span>
          </button>

          <button
            onClick={() => handleDownloadCSV(selectedIds.size > 0)}
            className="inline-flex items-center px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all space-x-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>
              {selectedIds.size > 0
                ? `Download Selected (${selectedIds.size})`
                : claimBatchFilter !== "all"
                ? `Download Batch (${displayedBatches[0]?.names.length || 0})`
                : `Download All (${filteredNames.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-4 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, account number, or routing..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="claimed">Claimed (Active)</option>
              <option value="allocated">Allocated (Unclaimed)</option>
              <option value="paid">Paid Out</option>
              <option value="matured">Matured</option>
              <option value="received">Received</option>
            </select>
          </div>

          {/* Backlog Filter */}
          <div className="sm:col-span-2">
            <select
              value={backlogFilter}
              onChange={(e) => setBacklogFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium bg-white text-gray-800"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular Only</option>
              <option value="backlog">Backlog Only</option>
              <option value="backlog_hidden">Backlog (Hidden)</option>
              <option value="backlog_visible">Backlog (Visible)</option>
            </select>
          </div>

          {/* Subaccount Filter */}
          <div className="sm:col-span-2">
            <select
              value={subaccountFilter}
              onChange={(e) => setSubaccountFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
            >
              <option value="all">All Subaccounts</option>
              <option value="self">Main Account (Self)</option>
              {subaccounts.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  Subaccount: {sub.username}
                </option>
              ))}
            </select>
          </div>

          {/* Claim Batch Filter */}
          <div className="sm:col-span-2">
            <select
              value={claimBatchFilter}
              onChange={(e) => setClaimBatchFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
            >
              <option value="all">All Batches ({filteredNames.length})</option>
              {batches.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.title} ({b.names.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary / Reset */}
        {(searchTerm || statusFilter !== "all" || subaccountFilter !== "all" || backlogFilter !== "all") && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-gray-500">
              Showing <strong>{filteredNames.length}</strong> of{" "}
              <strong>{payoutNames.length}</strong> names
            </span>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSubaccountFilter("all");
                setBacklogFilter("all");
              }}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar if items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-20 z-20 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
              {selectedIds.size}
            </span>
            <span className="text-xs font-medium">payout name(s) selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadCSV(true)}
              className="inline-flex items-center px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm transition-colors space-x-1.5"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              <span>Download Selected CSV</span>
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs text-white/80 hover:text-white transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoadingNames ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm">Loading client payout names...</p>
          </div>
        ) : filteredNames.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
              <BanknotesIcon className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-1">No Payout Names Found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
              {searchTerm || statusFilter !== "all" || subaccountFilter !== "all"
                ? "No payout names match your current search and filter criteria."
                : "This client currently has no payout names in their inventory."}
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={onOpenDirectClaim}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm space-x-1.5"
              >
                <BoltIcon className="w-3.5 h-3.5" />
                <span>Direct Claim Names</span>
              </button>
              <button
                onClick={onOpenCreateSpecific}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm space-x-1.5"
              >
                <TagIcon className="w-3.5 h-3.5" />
                <span>Add Specific Name</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/75">
                <tr>
                  <th className="px-4 py-3.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payout Name
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account & Routing
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Target Subaccount
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Claimed Date
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Maturity Date
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayedBatches.map((batch) => (
                  <React.Fragment key={batch.key}>
                    {/* Batch Header Row */}
                    <tr className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 border-y border-blue-200/80">
                      <td colSpan="9" className="px-5 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1 rounded bg-blue-600 text-white shadow-xs">
                              <CalendarDaysIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-gray-900 tracking-tight">
                              {batch.isUnknown ? "🔒 " : "📅 "}Batch: {batch.title}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {batch.names.length} {batch.names.length === 1 ? "name" : "names"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadBatch(batch)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 shadow-xs transition-all active:scale-95"
                            title="Download this specific batch as CSV"
                          >
                            <ArrowDownTrayIcon className="w-3 h-3 text-blue-600" />
                            <span>Download Batch CSV</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Batch Name Rows */}
                    {batch.names.map((pn) => {
                      const isSelected = selectedIds.has(pn._id);
                      const isClaimed = pn.status === "claimed";
                      return (
                        <tr
                          key={pn._id}
                          className={`hover:bg-gray-50/70 transition-colors ${
                            isSelected ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(pn._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{pn.name}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                              {pn.isBacklog ? (
                                pn.paymentStatus === 'not_received' ? (
                                  <span className="inline-flex items-center text-[10px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                    🔒 Backlog (Hidden from Client)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                    👁️ Backlog (Visible to Client)
                                  </span>
                                )
                              ) : isClaimed ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Claimed & Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Allocated (Unclaimed)
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                            <div className="font-mono font-medium text-gray-900">
                              Acc: {pn.accountNumber || "—"}
                            </div>
                            <div className="font-mono text-gray-500 text-[11px] mt-0.5">
                              Rout: {pn.routingNumber || "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            {pn.claimedForSubaccount ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                Subaccount: {pn.claimedForSubaccount.username || pn.claimedForSubaccount}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                Main Account (Self)
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                            {pn.claimedAt ? (
                              <span className="font-medium text-gray-800">
                                {new Date(pn.claimedAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Unknown / Legacy</span>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ${(pn.amount || 0).toFixed(2)}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                pn.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : pn.paymentStatus === "matured"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {pn.paymentStatus || "not_received"}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-sm">
                            {pn.paymentStatus === 'received' && pn.maturityDate ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs w-max">
                                  {new Date(pn.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-blue-600 font-medium mt-0.5">Maturing</span>
                              </div>
                            ) : pn.paymentStatus === 'matured' && pn.maturityDate ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 text-xs w-max">
                                  {new Date(pn.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-green-600 font-medium mt-0.5">Matured</span>
                              </div>
                            ) : pn.maturityDate ? (
                              <span className="text-xs text-gray-600">
                                {new Date(pn.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              type="button"
                              onClick={() => setSelectedPayoutNameForLogs(pn)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-xs"
                              title="View Activity Logs & Narration"
                            >
                              <DocumentTextIcon className="w-3.5 h-3.5" />
                              <span>Logs</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PayoutNameLogsModal
        isOpen={!!selectedPayoutNameForLogs}
        onClose={() => setSelectedPayoutNameForLogs(null)}
        payoutNameId={selectedPayoutNameForLogs?._id}
        payoutNameTitle={selectedPayoutNameForLogs?.name}
      />
    </div>
  );
}
