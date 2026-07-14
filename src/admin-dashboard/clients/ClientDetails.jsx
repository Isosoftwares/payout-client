import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import UpdateUserModal from "./UpdateUserModal";
import DeleteUserModal from "./DeleteUserModal";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  CheckBadgeIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../../hooks/useAuth";

function ClientDetails() {
  const { _id } = useParams();
  const navigate = useNavigate();
  const axios = useAxiosPrivate();
  const { auth } = useAuth();


  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const getMethodIcon = (methodType) => {
    switch (methodType) {
      case 'mpesa': return <DevicePhoneMobileIcon className="h-6 w-6 text-green-500" />;
      case 'bank': return <BanknotesIcon className="h-6 w-6 text-blue-500" />;
      case 'crypto': return <CurrencyDollarIcon className="h-6 w-6 text-purple-500" />;
      default: return <CreditCardIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Fetch client details
  const getClientDetails = () => {
    return axios.get(`/users/${_id}`);
  };

  const {
    data: clientData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["client", _id],
    queryFn: getClientDetails,
    retry: 2,
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch client details";
      toast.error(errorMessage);
    },
  });

  const client = clientData?.data?.data;

  const { data: accountsData, isLoading: loadingAccounts } = useQuery({
    queryKey: ["virtual-accounts", _id],
    queryFn: () => axios.get("/virtual-accounts"),
  });

  const { data: txData } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => axios.get("/transactions"),
  });

  const virtualAccounts =
    accountsData?.data?.data?.filter(
      (acc) => acc?.client?._id === _id || acc?.client === _id
    ) || [];

  const clientTransactions = txData?.data?.data?.filter(
    (tx) => tx?.client === _id || tx?.client?._id === _id
  ) || [];

  const totalGross = clientTransactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.grossAmount, 0);

  const totalCut = clientTransactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.feeAmount, 0);

  const totalPaid = clientTransactions
    .filter(tx => tx.type === 'payout')
    .reduce((sum, tx) => sum + tx.grossAmount, 0);

  const totalUnpaid = virtualAccounts.reduce((sum, acc) => sum + (acc.withdrawableBalance || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Client
          </h3>
          <p className="text-red-600 mb-4">
            {error?.response?.data?.message ||
              error?.message ||
              "An unexpected error occurred"}
          </p>
          <div className="space-x-3">
            <button
              onClick={() => navigate("/dashboard/clients")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Back to Clients
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className=" px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row  md:items-center md:justify-between py-4">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <button
                onClick={() => navigate("/dashboard/clients")}
                className="inline-flex items-center md:px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Clients
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {client?.profile?.firstName && client?.profile?.lastName
                    ? `${client.profile.firstName} ${client.profile.lastName}`
                    : client?.email}
                </h1>
                <p className="text-sm text-gray-600">
                  Client Details & Management
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center space-x-3 pt-2 md:pt-0">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              {/* <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className=" px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Client Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Full Name
                      </div>
                      <div className="text-gray-900">
                        {client?.profile?.firstName && client?.profile?.lastName
                          ? `${client.profile.firstName} ${client.profile.lastName}`
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
                      <div className="text-gray-900">{client?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Phone Number
                      </div>
                      <div className="text-gray-900">
                        {client?.profile?.phone || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                 

                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Member Since
                      </div>
                      <div className="text-gray-900">
                        {client?.createdAt
                          ? new Date(client.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      {client?.isActive ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Account Status
                      </div>
                      <div
                        className={`font-medium ${
                          client?.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {client?.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Fee Percentage Rate
                      </div>
                      <div className="text-gray-900 font-medium">
                        {client?.feePercentage || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Financial Overview
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${totalGross.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Total Gross
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ${totalCut.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    The Cut (Fees)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${totalPaid.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Paid Out
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${totalUnpaid.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Unpaid Balance
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Account Summary
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Role
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      client?.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {client?.role === "admin" ? "Admin" : "Client"}
                  </span>
                </div>


                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      client?.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {client?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">

                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Client
                </button>

                {/* <button
                  onClick={() => navigate(`/dashboard/clients/${_id}/history`)}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View History
                </button> */}
              </div>
            </div>
          </div>
        </div>

        <div className="py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <CreditCardIcon className="h-6 w-6 mr-3 text-primary" />
              Payment Methods
            </h3>
            
            <div className="space-y-4">
              {(!client?.paymentMethods || client.paymentMethods.length === 0) ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  No payment methods added by this client yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.paymentMethods.map((method) => (
                    <div key={method._id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="mt-1">
                        {getMethodIcon(method.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-gray-900 capitalize">
                            {method.type === 'mpesa' ? 'M-Pesa' : method.type === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}
                          </h4>
                          {method.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckBadgeIcon className="h-3 w-3 mr-1" /> Preferred
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 text-sm text-gray-600">
                          {method.type === 'mpesa' && (
                            <p>{method.details.name} • {method.details.phone}</p>
                          )}
                          {method.type === 'bank' && (
                            <div>
                              <p>{method.details.bankName} • {method.details.accountNumber}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{method.details.accountName}</p>
                            </div>
                          )}
                          {method.type === 'crypto' && (
                            <div>
                              <p className="font-medium text-gray-700">{method.details.currency} ({method.details.network})</p>
                              <p className="text-xs text-gray-500 mt-0.5 break-all">{method.details.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Client Virtual Accounts / Payout Names
            </h3>
            {loadingAccounts ? (
              <p className="text-gray-500">Loading accounts...</p>
            ) : virtualAccounts.length === 0 ? (
              <p className="text-gray-500">No virtual accounts created by this client yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawable Net</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {virtualAccounts.map((acc) => (
                      <tr key={acc._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {acc.firstName} {acc.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{acc.identifier || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${(acc.withdrawableBalance <= 0 ? 0 : acc.balance || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ${(acc.withdrawableBalance || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              acc.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {acc.status === "active" ? "Active" : "Pending Details"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <UpdateUserModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        client={clientData?.data?.data}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        client={client}
      />
    </div>
  );
}

export default ClientDetails;
