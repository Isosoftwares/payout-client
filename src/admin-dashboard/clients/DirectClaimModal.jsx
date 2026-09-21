import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { BoltIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function DirectClaimModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  subaccounts = [],
  allocatedCount = 0,
}) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(1);
  const [subaccountId, setSubaccountId] = useState("self");

  const { mutate: directClaim, isPending } = useMutation({
    mutationFn: (payload) => axios.post("/payout-names/claim", payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Names direct-claimed successfully!");
      queryClient.invalidateQueries(["payout-names", clientId]);
      queryClient.invalidateQueries(["client", clientId]);
      queryClient.invalidateQueries(["subaccounts", clientId]);
      onClose();
      setCount(1);
      setSubaccountId("self");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to direct-claim names");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!count || count < 1) {
      toast.warning("Please specify at least 1 name to claim");
      return;
    }
    directClaim({
      clientId,
      count: parseInt(count, 10),
      subaccountId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <BoltIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Direct Claim Payout Names</h3>
                <p className="text-xs text-gray-500">For {clientName || "Client"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/80 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span>Client Allocated (Unclaimed):</span>
                <span className="bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full font-mono">
                  {allocatedCount} available
                </span>
              </div>
              <p className="text-blue-700 leading-relaxed">
                Allocated un-claimed names are used first. Any remaining balance will be claimed
                automatically from the available pool without an allocation request.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Number of Names to Claim *
              </label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Assign Target (Self / Subaccount) *
              </label>
              <select
                value={subaccountId}
                onChange={(e) => setSubaccountId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
              >
                <option value="self">Main Account (Self)</option>
                {subaccounts.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    Subaccount: {sub.username}
                  </option>
                ))}
              </select>
              {subaccounts.length === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Client has no subaccounts yet. Names will be claimed directly for Main Account.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                <BoltIcon className="w-4 h-4" />
                <span>{isPending ? "Claiming Names..." : `Claim ${count || 1} Name(s)`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
