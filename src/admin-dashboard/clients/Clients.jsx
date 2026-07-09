import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserPlusIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import AddUser from "../components/AddUser";

function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("client");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();
  const axios = useAxiosPrivate();

  // Fetch clients with filters and pagination
  const getClients = () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "40",
      sortBy,
      sortOrder,
    });

    if (searchTerm) params.append("search", searchTerm);
    if (roleFilter) params.append("role", roleFilter);
    if (statusFilter) params.append("isActive", statusFilter);

    return axios.get(`/users?${params.toString()}`);
  };

  const {
    data: clientsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "clients",
      currentPage,
      searchTerm,
      roleFilter,
      statusFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: getClients,
    keepPreviousData: true,
    retry: 0,
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch clients";
      toast.error(errorMessage);
    },
  });

  const handleSearch = (e) => {
    setSearchTerm(e?.target?.value || "");
    setCurrentPage(1); // Reset to first page on search
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role === roleFilter ? "" : role);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? "" : status);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleDeleteClient = async (clientId, clientEmail) => {
    if (
      window.confirm(`Are you sure you want to delete client: ${clientEmail}?`)
    ) {
      try {
        await axios.delete(`/users/${clientId}`);
        toast.success("Client deleted successfully");
        refetch();
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete client";
        toast.error(errorMessage);
      }
    }
  };

  const clients = clientsData?.data?.data?.users || [];
  const pagination = clientsData?.data?.data?.pagination || {};

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className={`inline-flex items-center space-x-1 font-semibold text-xs uppercase tracking-wider transition-colors duration-200 ${
        sortBy === field ? "text-primary" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      <span>{children}</span>
      {sortBy === field && (
        <span className="text-primary">{sortOrder === "desc" ? "↓" : "↑"}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Client Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage client accounts, balances, and access permissions
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition-all duration-200"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="w-full px-3 py-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            >
              <option value="">All Roles</option>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {!isLoading && !isError && clients?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {pagination?.total || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Clients</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-green-600">
              {clients?.filter((client) => client?.isActive)?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Clients</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-blue-600">
              {clients?.filter((client) => client?.role === "client")?.length ||
                0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Client Accounts</div>
          </div>
          
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading || isRefetching ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading clients...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Clients
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
        ) : clients?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <UserPlusIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || roleFilter || statusFilter
                ? "No matching clients found"
                : "No clients yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || roleFilter || statusFilter
                ? "Try adjusting your search terms or filters"
                : "Add your first client to get started"}
            </p>
            {!searchTerm && !roleFilter && !statusFilter && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-all duration-200"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="email">Client Info</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="role">Role</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="isActive">Status</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="createdAt">Joined</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {clients?.map((client) => (
                    <tr
                      key={client?._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-6">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {client?.profile?.firstName &&
                            client?.profile?.lastName
                              ? `${client.profile.firstName} ${client.profile.lastName}`
                              : "No name provided"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client?.email}
                          </div>
                          {client?.profile?.company && (
                            <div className="text-xs text-gray-400 mt-1">
                              {client.profile.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            client?.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {client?.role === "admin" ? "Admin" : "Client"}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            client?.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {client?.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-500">
                        {client?.createdAt
                          ? new Date(client.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/clients/${client?._id}`)
                            }
                            className="text-primary hover:text-secondary p-2 rounded-lg hover:bg-orange-50 transition-all duration-200"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {/* <button
                            onClick={() =>
                              navigate(`/dashboard/clients/${client?._id}/edit`)
                            }
                            className="text-yellow-600 hover:text-yellow-700 p-2 rounded-lg hover:bg-yellow-50 transition-all duration-200"
                            title="Edit Client"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClient(client?._id, client?.email)
                            }
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                            title="Delete Client"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination?.pages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(pagination?.page - 1) * pagination?.limit + 1} to{" "}
                    {Math.min(
                      pagination?.page * pagination?.limit,
                      pagination?.total
                    )}{" "}
                    of {pagination?.total} clients
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Previous
                    </button>

                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination?.pages))]?.map(
                        (_, index) => {
                          const page = index + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                currentPage === page
                                  ? "bg-primary text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(pagination?.pages, currentPage + 1)
                        )
                      }
                      disabled={currentPage === pagination?.pages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            <AddUser handleCloseAddModal={() => {
              setShowAddModal(false);
              refetch();
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
