import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import {
  XMarkIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const EditProfileModal = ({ isOpen, onClose, user }) => {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      profile: {
        firstName: "",
        lastName: "",
        phone: "",
        company: "",
      },
      telegramUsername: "",
      telegramNotificationsEnabled: true,
    },
  });

  // Set default values when modal opens
  useEffect(() => {
    if (user && isOpen) {
      setValue("profile.firstName", user?.profile?.firstName || "");
      setValue("profile.lastName", user?.profile?.lastName || "");
      setValue("profile.phone", user?.profile?.phone || "");
      setValue("profile.company", user?.profile?.company || "");
      setValue("telegramUsername", user?.telegramUsername || "");
      setValue("telegramNotificationsEnabled", user?.telegramNotificationsEnabled !== false);
    }
  }, [user, isOpen, setValue]);

  // Update profile mutation
  const updateProfile = (data) => {
    return axios.patch(`/users/update-own/profile`, data);
  };

  const { mutate: updateProfileMutate, isLoading: loadingUpdate } = useMutation(
    {
      mutationFn: updateProfile,
      onSuccess: (response) => {
        const message =
          response?.data?.message || "Profile updated successfully";
        toast.success(message);
        queryClient.invalidateQueries(["own-profile"]);
        queryClient.invalidateQueries(["telegram-bot-info"]);
        handleClose();
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile";
        toast.error(errorMessage);
        console.error("Profile update error:", error);
      },
    }
  );

  const submitProfile = (data) => {
    try {
      // Clean up the data
      const profileData = {
        profile: {
          firstName: data?.profile?.firstName?.trim() || "",
          lastName: data?.profile?.lastName?.trim() || "",
          phone: data?.profile?.phone?.trim() || "",
          company: data?.profile?.company?.trim() || "",
        },
        telegramUsername: data?.telegramUsername?.trim() || "",
        telegramNotificationsEnabled: data?.telegramNotificationsEnabled !== false,
      };

      updateProfileMutate(profileData);
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Profile
                </h3>
                <p className="text-sm text-gray-600">
                  Update your personal information
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

        <form onSubmit={handleSubmit(submitProfile)} className="p-6 space-y-6">
          {/* Current User Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {user?.profile?.firstName && user?.profile?.lastName
                    ? `${user.profile.firstName.charAt(
                        0
                      )}${user.profile.lastName.charAt(0)}`
                    : user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-800">
                  Editing Profile for
                </h4>
                <p className="text-lg font-bold text-orange-900">
                  {user?.profile?.firstName && user?.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : "Profile"}
                </p>
                <p className="text-sm text-orange-700">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.profile?.firstName
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  {...register("profile.firstName", {
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters",
                    },
                  })}
                />
                {errors?.profile?.firstName && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.profile.firstName.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.profile?.lastName
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  {...register("profile.lastName", {
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters",
                    },
                  })}
                />
                {errors?.profile?.lastName && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.profile.lastName.message}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.profile?.phone
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  {...register("profile.phone", {
                    pattern: {
                      value: /^[+]?[0-9\s\-\(\)]+$/,
                      message: "Please enter a valid phone number",
                    },
                  })}
                />
                {errors?.profile?.phone && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.profile.phone.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  {...register("profile.company")}
                />
              </div>
            </div>
          </div>

          {/* Telegram Notifications Section */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.79-1.63 4.58-1.91 5.09-1.92.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07.01.21 0 .33z" />
                  </svg>
                  Telegram Notifications
                </h4>
                <p className="text-sm text-gray-500">
                  Receive instant alerts for payments, payouts, and requests directly in Telegram.
                </p>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram Username
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-medium">
                    @
                  </div>
                  <input
                    type="text"
                    placeholder="your_telegram_username"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200"
                    {...register("telegramUsername")}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter your username without @ (e.g. <code>john_doe</code>).
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="telegramNotificationsEnabled"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  {...register("telegramNotificationsEnabled")}
                />
                <label htmlFor="telegramNotificationsEnabled" className="text-sm text-gray-700 cursor-pointer select-none">
                  Enable Telegram notifications for this account
                </label>
              </div>
            </div>
          </div>

          {/* Account Information (Read-only) */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900">
              Account Information
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email Address
                  </label>
                  <p className="text-gray-900 mt-1">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Role
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                      user?.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user?.role === "admin" ? "Admin" : "Client"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Email and role cannot be changed from this form. Contact an
                administrator if changes are needed.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loadingUpdate}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingUpdate}
              className="px-6 py-3 bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {loadingUpdate ? (
                <div className="flex items-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
