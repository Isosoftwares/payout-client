import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { XMarkIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

function UpdateUserModal({ isOpen, onClose, client }) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: client?.email || "",
      role: client?.role || "client",
      isActive: client?.isActive ?? true,
      feePercentage: client?.feePercentage || 0,
      usdBuyPrice: client?.usdBuyPrice || 0,
      usdSellPrice: client?.usdSellPrice || 0,
      dailySelfAllocationLimit: client?.dailySelfAllocationLimit || 0,
      profile: {
        firstName: client?.profile?.firstName || "",
        lastName: client?.profile?.lastName || "",
        phone: client?.profile?.phone || "",
        company: client?.profile?.company || "",
      },
      telegramUsername: client?.telegramUsername || "",
    },
  });

  React.useEffect(() => {
    if (client && isOpen) {
      reset({
        email: client?.email || "",
        role: client?.role || "client",
        isActive: client?.isActive ?? true,
        feePercentage: client?.feePercentage || 0,
        usdBuyPrice: client?.usdBuyPrice || 0,
        usdSellPrice: client?.usdSellPrice || 0,
        dailySelfAllocationLimit: client?.dailySelfAllocationLimit || 0,
        profile: {
          firstName: client?.profile?.firstName || "",
          lastName: client?.profile?.lastName || "",
          phone: client?.profile?.phone || "",
          company: client?.profile?.company || "",
        },
        telegramUsername: client?.telegramUsername || "",
      });
    }
  }, [client, isOpen, reset]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (userData) => {
      return axios.patch(`/users/${client?._id}`, userData);
    },
    onSuccess: (response) => {
      const message = response?.data?.message || "User updated successfully";
      toast.success(message);
      queryClient.invalidateQueries(["client", client?._id]);
      queryClient.invalidateQueries(["clients"]);
      onClose();
      reset();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update user";
      toast.error(errorMessage);
    },
  });

  const onSubmitting = async (data) => {
    try {
      // Clean up the data - only send fields that have values
      const updateData = {
        email: data?.email?.trim(),
        role: data?.role,
        isActive: data?.isActive,
        feePercentage: Number(data?.feePercentage) || 0,
        usdBuyPrice: Number(data?.usdBuyPrice) || 0,
        usdSellPrice: Number(data?.usdSellPrice) || 0,
        dailySelfAllocationLimit: Number(data?.dailySelfAllocationLimit) || 0,
        telegramUsername: data?.telegramUsername?.trim() || "",
      };

      // Only include profile if at least one field has a value
      const profileData = {
        firstName: data?.profile?.firstName?.trim() || "",
        lastName: data?.profile?.lastName?.trim() || "",
        phone: data?.profile?.phone?.trim() || "",
        company: data?.profile?.company?.trim() || "",
      };

      updateData.profile = profileData;

      updateUserMutation.mutate(updateData);
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitting)} className="p-6 space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">
              Account Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address",
                    },
                  })}
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="user@example.com"
                />
                {errors?.email && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  {...register("role", { required: "Role is required" })}
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.role ? "border-red-300" : "border-gray-300"
                  }`}
                  // disabled
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
                {errors?.role && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.role.message}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-4">
              <div>
                <label className="flex items-center space-x-3 mt-4">
                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Account is active
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Percentage Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("feePercentage", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Cannot be less than 0" },
                    max: { value: 100, message: "Cannot exceed 100%" }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.feePercentage ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g. 20"
                />
                {errors?.feePercentage && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.feePercentage.message}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USD Buy Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("usdBuyPrice", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Cannot be less than 0" }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.usdBuyPrice ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g. 130.50"
                />
                {errors?.usdBuyPrice && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.usdBuyPrice.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USD Sell Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("usdSellPrice", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Cannot be less than 0" }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                    errors?.usdSellPrice ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g. 135.00"
                />
                {errors?.usdSellPrice && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.usdSellPrice.message}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Self-Allocation Limit (Names / Day)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...register("dailySelfAllocationLimit", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Cannot be less than 0" }
                })}
                className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                  errors?.dailySelfAllocationLimit ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g. 10 (0 for manual admin approval only)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum payout names this client can self-allocate per calendar day without waiting for admin approval. Set to 0 to require admin approval for all requests.
              </p>
              {errors?.dailySelfAllocationLimit && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.dailySelfAllocationLimit.message}
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900">
              Profile Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  {...register("profile.firstName")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  {...register("profile.lastName")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register("profile.phone")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  {...register("profile.company")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Company Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-medium">
                  @
                </div>
                <input
                  type="text"
                  {...register("telegramUsername")}
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="username (without @)"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Client can link to BotFather bot to receive real-time payout & payment alerts.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isLoading}
              className="px-6 py-3 bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {updateUserMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateUserModal;
