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

function DeleteUserModal({ isOpen, onClose, client }) {
  const [confirmationText, setConfirmationText] = useState("");
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
                  This action cannot be undone
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
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Warning: This will permanently delete the user account
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• The user will be deactivated and cannot login</li>
                  <li>• All user data will be preserved for audit purposes</li>
                  <li>• This action cannot be reversed</li>
                  {client?.balance > 0 && (
                    <li className="font-medium">
                      • Current balance: ${client.balance.toFixed(2)} will be
                      locked
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

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
                    accounts available to manage the system before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              User to be deleted:
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">
                  {clientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">
                  {client.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <span
                  className={`text-sm font-medium ${
                    client.role === "admin"
                      ? "text-purple-600"
                      : "text-blue-600"
                  }`}
                >
                  {client.role === "admin" ? "Admin" : "Client"}
                </span>
              </div>
              {client.role === "client" && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="text-sm font-medium text-green-600">
                    ${client.balance?.toFixed(2) || "0.00"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type{" "}
              <span className="font-bold text-red-600">{client.email}</span> to
              confirm deletion:
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

          {/* Final Warning */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              <strong>Note:</strong> This action will deactivate the user
              account. The user will no longer be able to login, but their data
              will be preserved for historical and audit purposes.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmationValid || deleteUserMutation.isLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center"
            >
              {deleteUserMutation.isLoading ? (
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserModal;
