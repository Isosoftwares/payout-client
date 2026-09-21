import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  UserPlusIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function ClientSubaccountsTab({
  clientId,
  clientName,
  subaccounts = [],
  isLoadingSubaccounts = false,
  onOpenCreateModal,
}) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [subaccountToDelete, setSubaccountToDelete] = useState(null);

  const { mutate: deleteSubaccount, isPending: isDeleting } = useMutation({
    mutationFn: (id) => axios.delete(`/subaccounts/${id}`),
    onSuccess: () => {
      toast.success("Subaccount deleted successfully");
      queryClient.invalidateQueries(["subaccounts", clientId]);
      queryClient.invalidateQueries(["payout-names", clientId]);
      setSubaccountToDelete(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete subaccount");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Client Subaccounts</h3>
              <p className="text-xs text-gray-500">
                Manage broker subaccounts created for {clientName || "this client"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all space-x-2"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Create Subaccount</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoadingSubaccounts ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm">Loading client subaccounts...</p>
          </div>
        ) : subaccounts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600">
              <UserGroupIcon className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-1">No Subaccounts Found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
              This client hasn't created any subaccounts yet. You can create one for them now.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm space-x-2"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span>Create Subaccount</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/75">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Subaccount Username
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Claimed Names Count
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {subaccounts.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                          {sub.username?.slice(0, 2) || "SB"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{sub.username}</div>
                          <div className="text-[11px] text-gray-400 font-mono">ID: {sub._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <IdentificationIcon className="w-3.5 h-3.5 mr-1" />
                        {sub.claimedCount || 0} names claimed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1.5 text-xs">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => setSubaccountToDelete(sub)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Subaccount"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {subaccountToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSubaccountToDelete(null)}
            ></div>
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Subaccount</h3>
                  <p className="text-xs text-gray-500">Action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete subaccount{" "}
                <strong className="text-gray-900 font-semibold">{subaccountToDelete.username}</strong>?
                Any claimed names assigned to this subaccount will be re-assigned back to the client's Main Account.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSubaccountToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteSubaccount(subaccountToDelete._id)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
