import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../hooks/useAuth";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import EditProfileModal from "./components/EditProfileModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import PaymentMethodsSection from "./components/PaymentMethodsSection";
import { toast } from "react-toastify";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  PencilIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

function AdminProfile() {
  const { auth } = useAuth();
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Fetch user profile
  const getUserProfile = async () => {
    return await axios.get(`/users/profile/own`);
  };

  const {
    isLoading: loadingUser,
    data: userData,
    error: userError,
    isError: isUserError,
    refetch,
  } = useQuery({
    queryFn: getUserProfile,
    queryKey: ["own-profile"],
    retry: 0,
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch profile";
      toast.error(errorMessage);
    },
  });

  const user = userData?.data?.data;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get initials for avatar
  const getInitials = () => {
    const firstName = user?.profile?.firstName || "";
    const lastName = user?.profile?.lastName || "";
    const email = user?.email || "";

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return email.charAt(0)?.toUpperCase() || "U";
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user?.email || "User";
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isUserError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Profile
          </h3>
          <p className="text-red-600 mb-4">
            {userError?.response?.data?.message ||
              userError?.message ||
              "An unexpected error occurred"}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className=" px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">
                    {getInitials()}
                  </span>
                </div>

                {/* Name and Role */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {getDisplayName()}
                </h2>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user?.role === "admin" ? "Administrator" : "Client"}
                </span>

                {/* Status */}
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="h-5 w-5 flex items-center justify-center">
                    {user?.isActive ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      user?.isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {user?.isActive ? "Active Account" : "Inactive Account"}
                  </span>
                </div>

              

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <UserCircleIcon className="h-6 w-6 mr-3 text-primary" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Full Name
                    </div>
                    <div className="text-gray-900">
                      {user?.profile?.firstName && user?.profile?.lastName
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : "Not provided"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Email Address
                    </div>
                    <div className="text-gray-900">
                      {user?.email || "Not available"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Phone Number
                    </div>
                    <div className="text-gray-900">
                      {user?.profile?.phone || "Not provided"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Company
                    </div>
                    <div className="text-gray-900">
                      {user?.profile?.company || "Not provided"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <CalendarDaysIcon className="h-6 w-6 mr-3 text-green-600" />
                Account Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Account Role
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user?.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user?.role === "admin" ? "Administrator" : "Client"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Account Status
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user?.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Account Created
                  </div>
                  <div className="text-gray-900 mt-1">
                    {formatDate(user?.createdAt)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Last Updated
                  </div>
                  <div className="text-gray-900 mt-1">
                    {formatDate(user?.updatedAt)}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modals */}
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
        />

        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      </div>
    </div>
  );
}

export default AdminProfile;
