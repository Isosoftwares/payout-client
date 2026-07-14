import React from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import PaymentMethodsSection from "../../admin-dashboard/profile/components/PaymentMethodsSection";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

function PaymentMethodsPage() {
  const axios = useAxiosPrivate();

  const getUserProfile = async () => {
    return await axios.get(`/users/profile/own`);
  };

  const {
    isLoading,
    data: userData,
    error,
    isError,
    refetch,
  } = useQuery({
    queryFn: getUserProfile,
    queryKey: ["own-profile"],
    retry: 0,
    onError: (err) => {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch profile";
      toast.error(errorMessage);
    },
  });

  const user = userData?.data?.data;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Information
          </h3>
          <p className="text-red-600 mb-4">
            {error?.response?.data?.message ||
              error?.message ||
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your payout destinations like M-Pesa lines, Banks, and Crypto addresses.
        </p>
      </div>

      <div className="max-w-4xl">
        <PaymentMethodsSection user={user} />
      </div>
    </div>
  );
}

export default PaymentMethodsPage;
