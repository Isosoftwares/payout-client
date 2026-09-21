import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { UserPlusIcon, XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function CreateSubaccountModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: createSubaccount, isPending } = useMutation({
    mutationFn: (payload) => axios.post("/subaccounts", payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Subaccount created successfully!");
      queryClient.invalidateQueries(["subaccounts", clientId]);
      handleClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to create subaccount";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setErrorMessage("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedUser = username.trim().toLowerCase();
    if (!trimmedUser) {
      setErrorMessage("Username is required");
      return;
    }
    if (trimmedUser === "self") {
      setErrorMessage("The username 'self' is reserved and cannot be used");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    createSubaccount({
      clientId,
      username: trimmedUser,
      password,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <UserPlusIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Client Subaccount</h3>
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
                Subaccount Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                placeholder="e.g. broker_mike"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Must be unique. "self" is reserved.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                placeholder="Minimum 6 characters"
              />
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
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>{isPending ? "Creating..." : "Create Subaccount"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
