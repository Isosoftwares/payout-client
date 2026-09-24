import React, { useState, useEffect } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import {
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  CheckCircleIcon,
  SparklesIcon,
  ChatBubbleLeftEllipsisIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function PayoutNameLogsModal({ isOpen, onClose, payoutNameId, payoutNameTitle }) {
  const axios = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [payoutName, setPayoutName] = useState(null);
  const [narration, setNarration] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchLogs = async () => {
    if (!payoutNameId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/payout-names/${payoutNameId}/logs`);
      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setPayoutName(res.data.payoutName || null);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      toast.error(err.response?.data?.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && payoutNameId) {
      setNarration('');
      fetchLogs();
    }
  }, [isOpen, payoutNameId]);

  const handleAddNarration = async (e) => {
    e.preventDefault();
    if (!narration.trim()) {
      toast.warning('Please enter a narration or note.');
      return;
    }

    setSubmittingNote(true);
    try {
      const res = await axios.post(`/payout-names/${payoutNameId}/logs/narration`, {
        narration: narration.trim(),
      });
      if (res.data?.success) {
        toast.success('Narration note added successfully.');
        setNarration('');
        if (res.data.log) {
          setLogs((prev) => [res.data.log, ...prev]);
        } else {
          fetchLogs();
        }
      }
    } catch (err) {
      console.error('Error adding narration:', err);
      toast.error(err.response?.data?.message || 'Failed to add narration note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'payment_received':
        return {
          label: 'Payment Received',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: <BanknotesIcon className="w-4 h-4 text-emerald-600" />,
        };
      case 'matured':
        return {
          label: 'Marked as Matured',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: <ClockIcon className="w-4 h-4 text-blue-600" />,
        };
      case 'paid':
        return {
          label: 'Paid / Disbursed',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          icon: <CheckCircleIcon className="w-4 h-4 text-purple-600" />,
        };
      case 'claimed':
        return {
          label: 'Claimed',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: <SparklesIcon className="w-4 h-4 text-amber-600" />,
        };
      case 'created':
        return {
          label: 'Created',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          icon: <DocumentTextIcon className="w-4 h-4 text-slate-600" />,
        };
      case 'narration_note':
        return {
          label: 'Note / Narration',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          icon: <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-indigo-600" />,
        };
      default:
        return {
          label: action ? action.replace('_', ' ') : 'Activity',
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          dot: 'bg-gray-500',
          icon: <ClockIcon className="w-4 h-4 text-gray-600" />,
        };
    }
  };

  const getActorLabel = (log) => {
    if (log.performedByRole === 'system' || !log.performedBy) {
      return 'Automated System';
    }
    const user = log.performedBy;
    const name =
      user.profile?.companyName ||
      [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.email;
    const roleTag = user.role === 'admin' ? 'Admin' : 'Client';
    return `${name} (${roleTag})`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <DocumentTextIcon className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Activity Logs & Narration
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-semibold text-gray-800 text-sm">
                {payoutName?.name || payoutNameTitle || 'Payout Name'}
              </span>
              {payoutName?.accountNumber && (
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                  Acc: {payoutName.accountNumber}
                </span>
              )}
              {payoutName?.routingNumber && (
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                  Rout: {payoutName.routingNumber}
                </span>
              )}
              {payoutName?.paymentStatus && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    payoutName.paymentStatus === 'paid'
                      ? 'bg-purple-100 text-purple-800'
                      : payoutName.paymentStatus === 'matured'
                      ? 'bg-green-100 text-green-800'
                      : payoutName.paymentStatus === 'received'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {payoutName.paymentStatus.replace('_', ' ')}
                </span>
              )}
              {payoutName?.amount > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Current: ${payoutName.amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/40">
          {/* Add Narration Box */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1.5">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-blue-600" />
              <span>Add Narration / Operational Note</span>
            </h3>
            <form onSubmit={handleAddNarration} className="space-y-3">
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Enter a narration note for this payout name (e.g. receipt confirmation, bank reference, customer note)..."
                rows={2}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !narration.trim()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                >
                  {submittingNote ? (
                    <>
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-3.5 h-3.5" />
                      <span>Save Narration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Logs Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                <span>Timeline of Events ({logs.length})</span>
              </h3>
              <button
                type="button"
                onClick={fetchLogs}
                disabled={loading}
                className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs">Loading activity logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300 space-y-2">
                <DocumentTextIcon className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-medium text-gray-700">No activity logs recorded yet</p>
                <p className="text-xs text-gray-500">
                  Payments received, maturity events, disbursements, and manual narration notes will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <div
                      key={log._id}
                      className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs hover:border-gray-300 transition-all space-y-2.5"
                    >
                      {/* Top Bar of Log Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>

                          {log.amount !== null && log.amount !== undefined && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                log.action === 'payment_received'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : log.action === 'paid'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.action === 'payment_received' ? `+$${log.amount.toFixed(2)}` : `$${log.amount.toFixed(2)}`}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500 flex items-center space-x-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(log.timestamp || log.createdAt)}</span>
                        </div>
                      </div>

                      {/* Narration Message */}
                      {log.narration && (
                        <div className="text-xs sm:text-sm text-gray-800 bg-gray-50/80 p-3 rounded-lg border border-gray-100 font-normal leading-relaxed">
                          {log.narration}
                        </div>
                      )}

                      {/* Dates and Actor Footer */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100/80 gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {log.paymentDate && (
                            <span className="flex items-center space-x-1">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-500" />
                              <span>Payment Date: <strong className="text-gray-700">{new Date(log.paymentDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
                            </span>
                          )}
                          {log.maturityDate && (
                            <span className="flex items-center space-x-1">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>Maturity Date: <strong className="text-gray-700">{new Date(log.maturityDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
                            </span>
                          )}
                        </div>

                        <div className="text-gray-500">
                          By: <strong className="text-gray-700">{getActorLabel(log)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
