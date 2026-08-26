import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [assignCount, setAssignCount] = useState(1);
  const [unassignCount, setUnassignCount] = useState(1);
  const queryClient = useQueryClient();

  const { mutate: assignNames, isPending: isAssigning } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/assign', data),
    onSuccess: () => {
      toast.success('Names successfully assigned to client');
      queryClient.invalidateQueries(["payout-names", _id]);
      setShowAssignModal(false);
      setAssignCount(1);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to assign names');
    },
  });

  const { mutate: unassignNames, isPending: isUnassigning } = useMutation({
    mutationFn: (data) => axios.post('/payout-names/unassign', data),
    onSuccess: () => {
      toast.success('Names successfully unallocated from client');
      queryClient.invalidateQueries(["payout-names", _id]);
      setShowUnassignModal(false);
      setUnassignCount(1);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to unallocate names');
    },
  });

  const handleAssignNames = (e) => {
    e.preventDefault();
    assignNames({ clientId: _id, count: assignCount });
  };

  const handleUnassignNames = (e) => {
    e.preventDefault();
    unassignNames({ clientId: _id, count: unassignCount });
  };

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
    queryFn: () => axios.get("/virtual-accounts?limit=1000"),
  });

  const { data: payoutNamesData } = useQuery({
    queryKey: ["payout-names", _id],
    queryFn: () => axios.get(`/payout-names?limit=1000&allocatedTo=${_id}`),
  });

  const { data: txData } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => axios.get("/transactions?limit=1000"),
  });

  const virtualAccounts =
    accountsData?.data?.data?.data?.filter(
      (acc) => acc?.client?._id === _id || acc?.client === _id
    ) || [];

  const clientTransactions = txData?.data?.data?.data?.filter(
    (tx) => tx?.client === _id || tx?.client?._id === _id
  ) || [];

  const totalReceived = client?.totalReceivedUSD || 0;
  const totalMatured = client?.totalMaturedUSD || 0;
  const totalPaid = client?.totalPaidUSD || 0;
  const totalFees = client?.totalFeesUSD || 0;
  const totalUnpaid = totalReceived + totalMatured;
  const totalGross = totalUnpaid + totalPaid;

  const clientPayoutNames = payoutNamesData?.data?.data || [];
  const allocatedUnclaimedCount = clientPayoutNames.filter(pn => pn.status === 'allocated').length;
  const claimedCount = clientPayoutNames.filter(pn => pn.status === 'claimed').length;
  const totalAssigned = clientPayoutNames.length;

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

                  <div className="flex items-center space-x-3">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        USD Buy/Sell Price
                      </div>
                      <div className="text-gray-900">
                        <span className="text-green-600 font-medium">Buy: Ksh {client?.usdBuyPrice || 0}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-blue-600 font-medium">Sell: Ksh {client?.usdSellPrice || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Added By
                      </div>
                      <div className="text-gray-900">
                        {client?.createdBy
                          ? (client.createdBy.profile?.firstName
                              ? `${client.createdBy.profile.firstName} ${client.createdBy.profile.lastName || ''}`
                              : client.createdBy.email)
                          : "System / Self-registered"}
                      </div>
                    </div>
                  </div>

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
                    ${totalFees.toFixed(2)}
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
                  <div className="text-2xl font-bold text-purple-600">
                    ${(client?.totalProfitUSD || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Total Profit Generated
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
              
              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-4">
                Payout Names Inventory
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 text-sm">
                  <span className="text-gray-600">Total Assigned</span>
                  <span className="font-semibold text-gray-900">{totalAssigned}</span>
                </div>
                <div className="flex items-center justify-between p-2 text-sm">
                  <span className="text-gray-600">Allocated (Unclaimed)</span>
                  <span className="font-semibold text-yellow-600">{allocatedUnclaimedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 text-sm">
                  <span className="text-gray-600">Claimed & Active</span>
                  <span className="font-semibold text-green-600">{claimedCount}</span>
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
                  onClick={() => setShowAssignModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Assign Payout Names
                </button>

                <button
                  onClick={() => setShowUnassignModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Unassign Payout Names
                </button>

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
                            <p>{method.details.name} • {method.details.phone} • <span className="font-semibold text-gray-700">KES</span></p>
                          )}
                          {method.type === 'bank' && (
                            <div>
                              <p>{method.details.bankName} • {method.details.accountNumber}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{method.details.accountName} • <span className="font-semibold text-gray-700">{method.details.bankCurrency || 'KES'}</span></p>
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
              Client Payout Names Inventory
            </h3>
            {clientPayoutNames.length === 0 ? (
              <p className="text-gray-500">No payout names allocated to this client yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientPayoutNames.map((pn) => (
                      <tr key={pn._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{pn.name}</div>
                          <div className="text-xs text-gray-500">{pn.status === 'claimed' ? 'Claimed' : 'Unclaimed'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {pn.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${(pn.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            pn.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            pn.paymentStatus === 'matured' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pn.paymentStatus || 'received'}
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

      {/* Assign Names Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <form onSubmit={handleAssignNames}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <PlusIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">Assign Payout Names</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Directly allocate a specified number of payout names to this client without a request.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Names to Assign
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={assignCount}
                            onChange={(e) => setAssignCount(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                  >
                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Names Modal */}
      {showUnassignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUnassignModal(false)}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <form onSubmit={handleUnassignNames}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ArrowLeftIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">Unassign Payout Names</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Return a specific number of unused (un-claimed) payout names back to the general pool from this client.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Names to Unassign
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={unassignCount}
                            onChange={(e) => setUnassignCount(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    disabled={isUnassigning}
                    className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                  >
                    {isUnassigning ? 'Unassigning...' : 'Confirm Unassignment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUnassignModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetails;
