import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { TagIcon, XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function CreateSpecificNameModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  subaccounts = [],
}) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    accountNumber: "",
    routingNumber: "",
    subaccountId: "self",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: createSpecificName, isPending } = useMutation({
    mutationFn: (payload) => axios.post("/payout-names/admin/create-specific", payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Specific payout name created and claimed successfully!");
      queryClient.invalidateQueries(["payout-names", clientId]);
      queryClient.invalidateQueries(["client", clientId]);
      queryClient.invalidateQueries(["subaccounts", clientId]);
      handleClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to create specific payout name";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData({
      name: "",
      accountNumber: "",
      routingNumber: "",
      subaccountId: "self",
    });
    setErrorMessage("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Payout Name is required");
      return;
    }
    if (!formData.accountNumber.trim()) {
      setErrorMessage("Account Number is required");
      return;
    }
    if (!formData.routingNumber.trim()) {
      setErrorMessage("Routing Number is required");
      return;
    }

    createSpecificName({
      clientId,
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      routingNumber: formData.routingNumber.trim(),
      subaccountId: formData.subaccountId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-blue-50 to-teal-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Specific Payout Name</h3>
                <p className="text-xs text-gray-500">For {clientName || "Client"}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/80 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Payout Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                placeholder="e.g. John Doe Consulting"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Checked automatically for duplicates in the database.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono font-medium"
                  placeholder="e.g. 1029384756"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Routing Number *
                </label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono font-medium"
                  placeholder="e.g. 021000021"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Assign Target (Self / Subaccount) *
              </label>
              <select
                value={formData.subaccountId}
                onChange={(e) => setFormData({ ...formData, subaccountId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
              >
                <option value="self">Main Account (Self)</option>
                {subaccounts.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    Subaccount: {sub.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800">
              This specific name will be created immediately with <strong>Claimed</strong> status and allocated to {clientName || "the client"}.
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                <TagIcon className="w-4 h-4" />
                <span>{isPending ? "Creating..." : "Create & Claim Name"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
