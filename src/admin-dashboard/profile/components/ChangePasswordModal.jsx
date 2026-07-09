import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  XMarkIcon,
  ExclamationCircleIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import useLogout from "../../../hooks/useLogout";
import { useNavigate } from "react-router-dom";

function ChangePasswordModal({ isOpen, onClose }) {
  const axios = useAxiosPrivate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const logout = useLogout();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  // Change password mutation - updated to match backend API
  const changePasswordMutation = useMutation({
    mutationFn: (data) => {
      return axios.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: (response) => {
      const message =
        response?.data?.message || "Password changed successfully";
      toast.success(message);
      handleClose();
      logout(); // Log out user after password change
      navigate("/", { replace: true });
      
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to change password";
      toast.error(errorMessage);
    },
  });

  const onSubmitting = async (data) => {
    try {
      if (data.newPassword !== data.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }

      if (data.currentPassword === data.newPassword) {
        toast.error("New password must be different from current password");
        return;
      }

      changePasswordMutation.mutate(data);
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Password change error:", error);
    }
  };

  const handleClose = () => {
    reset();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
      errors.push("At least 6 characters");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("One number");
    }
    return errors;
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <KeyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Password
                </h3>
                <p className="text-sm text-gray-600">
                  Update your account password
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

        <form onSubmit={handleSubmit(onSubmitting)} className="p-6 space-y-6">
          {/* Security Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-primary mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-semibold text-primary">
                  Security Reminder
                </h4>
                <p className="text-sm text-gray-700 mt-1">
                  Use a strong password with at least 6 characters including
                  uppercase, lowercase, and numbers.
                </p>
              </div>
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
                className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                  errors?.currentPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors?.currentPassword && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {errors.currentPassword.message}
              </div>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                {...register("newPassword", {
                  required: "New password is required",
                  validate: (value) => {
                    const errors = validatePassword(value);
                    return (
                      errors.length === 0 ||
                      `Password must contain: ${errors.join(", ")}`
                    );
                  },
                })}
                className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                  errors?.newPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors?.newPassword && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {errors.newPassword.message}
              </div>
            )}

            {/* Password Requirements */}
            {newPassword && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Password Requirements:
                </div>
                <div className="space-y-1">
                  {[
                    {
                      text: "At least 6 characters",
                      valid: newPassword.length >= 6,
                    },
                    {
                      text: "One lowercase letter",
                      valid: /(?=.*[a-z])/.test(newPassword),
                    },
                    {
                      text: "One uppercase letter",
                      valid: /(?=.*[A-Z])/.test(newPassword),
                    },
                    { text: "One number", valid: /(?=.*\d)/.test(newPassword) },
                  ].map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          req.valid ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <span
                        className={`text-xs ${
                          req.valid ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Please confirm your new password",
                  validate: (value) =>
                    value === newPassword || "Passwords do not match",
                })}
                className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                  errors?.confirmPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors?.confirmPassword && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Security Notice:</strong> After changing your
                  password, you'll need to log in again with your new
                  credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={changePasswordMutation.isLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                changePasswordMutation.isLoading || passwordErrors.length > 0
              }
              className="px-6 py-3 bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {changePasswordMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Changing...
                </div>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
