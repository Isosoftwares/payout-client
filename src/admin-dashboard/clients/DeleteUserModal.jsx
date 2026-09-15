import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

function DeleteUserModal({ isOpen, onClose, client, claimedCount = 0, allocatedCount = 0, onSuspendInstead }) {
  const [confirmationText, setConfirmationText] = useState("");
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const hasClaimed = claimedCount > 0;
  const hasAllocated = allocatedCount > 0;
  const canDelete = !hasClaimed && !hasAllocated;

  const expectedConfirmation = client?.email || "";
  const isConfirmationValid =
    confirmationText.toLowerCase() === expectedConfirmation.toLowerCase();

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: () => {
      return axios.delete(`/users/${client?._id}`);
    },
    onSuccess: (response) => {
      const message = response?.data?.message || "User deleted successfully";
      toast.success(message);
      queryClient.invalidateQueries(["clients"]);
      onClose();
      navigate("/dashboard/clients");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete user";
      toast.error(errorMessage);
    },
  });

  const handleDelete = () => {
    if (!canDelete) {
      if (hasClaimed) {
        toast.error("Clients with claimed names cannot be deleted. You can suspend the client instead.");
      } else if (hasAllocated) {
        toast.error("Clients with allocated names cannot be deleted unless all names are de-allocated.");
      }
      return;
    }

    if (!isConfirmationValid) {
      toast.error("Please enter the correct email address to confirm deletion");
      return;
    }
    deleteUserMutation.mutate();
  };

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  if (!isOpen || !client) return null;

  const isLastAdmin = client?.role === "admin";
  const clientName =
    client?.profile?.firstName && client?.profile?.lastName
      ? `${client.profile.firstName} ${client.profile.lastName}`
      : client?.email;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete User
                </h3>
                <p className="text-sm text-gray-600">
                  {canDelete ? "Permanent account removal" : "Action restricted"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Guardrail 1: Claimed Names Warning */}
          {hasClaimed && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-1">
                    Cannot Delete: Claimed Names Exist
                  </h4>
                  <p className="text-sm text-amber-800">
                    This client has <strong className="font-bold">{claimedCount} claimed payout name(s)</strong> with active banking details and transactions.
                  </p>
                  <p className="text-sm text-amber-800 mt-2 font-medium">
                    Clients with claimed names cannot be deleted, but can be suspended.
                  </p>
                  {onSuspendInstead && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onSuspendInstead();
                      }}
                      className="mt-3 inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                    >
                      Suspend Client Instead
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Guardrail 2: Allocated Names Warning */}
          {!hasClaimed && hasAllocated && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                    Cannot Delete: Allocated Names Exist
                  </h4>
                  <p className="text-sm text-yellow-800">
                    This client has <strong className="font-bold">{allocatedCount} allocated (unclaimed) payout name(s)</strong>.
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Clients with allocated names cannot be deleted unless all names are de-allocated first. Please use "Unassign Payout Names" in Quick Actions to return them to the pool.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Normal Delete Warning */}
          {canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Warning: This action is permanent
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• The client account and subaccounts will be deleted</li>
                    <li>• The client has 0 allocated and 0 claimed names</li>
                    <li>• This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Admin Warning */}
          {isLastAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ShieldExclamationIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Admin Account Notice
                  </h4>
                  <p className="text-sm text-yellow-700">
                    This is an admin account. Make sure there are other admin
                    accounts available before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              User Details:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{client.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Claimed Names:</span>
                <span className={`font-semibold ${claimedCount > 0 ? "text-amber-600" : "text-gray-700"}`}>
                  {claimedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Allocated (Unclaimed):</span>
                <span className={`font-semibold ${allocatedCount > 0 ? "text-yellow-600" : "text-gray-700"}`}>
                  {allocatedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Input - Only enabled if canDelete */}
          {canDelete ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">{client.email}</span> to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                  confirmationText && !isConfirmationValid
                    ? "border-red-300 focus:ring-red-500"
                    : confirmationText && isConfirmationValid
                    ? "border-green-300 focus:ring-green-500"
                    : "border-gray-300 focus:ring-primary"
                }`}
                placeholder="Enter email address to confirm"
              />
              {confirmationText && !isConfirmationValid && (
                <p className="mt-2 text-sm text-red-600">
                  Email address doesn't match. Please type exactly: {client.email}
                </p>
              )}
              {confirmationText && isConfirmationValid && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Confirmation matched
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">
                Deletion is disabled until all criteria are satisfied.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {canDelete ? "Cancel" : "Close"}
            </button>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={!isConfirmationValid || deleteUserMutation.isPending}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Delete User
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserModal;
