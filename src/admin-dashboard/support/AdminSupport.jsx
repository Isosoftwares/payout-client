import React, { useState, useEffect, useRef } from "react";
import PulseLoader from "react-spinners/PulseLoader";
import useAuth from "../../hooks/useAuth";
import Select from "react-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pagination } from "@mantine/core";
import { Link } from "react-router-dom";
import { Indicator } from "@mantine/core";
import { HiRefresh, HiSearch, HiUsers, HiChatAlt2 } from "react-icons/hi";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

function AdminSupport() {
  const axios = useAxiosPrivate();

  const [perPage, setPerPage] = useState(10);
  const [activePage, setPage] = useState(1);
  const [userId, setJabberId] = useState("");
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");

  const queryClient = useQueryClient();

  const { auth } = useAuth();
  
  const perPageOptions = [
    { label: "10", value: "10" },
    { label: "30", value: "30" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
  ];
  
  const roleOptions = [
    { label: "All Roles", value: "" },
    { label: "Client", value: "client" },
    // { label: "Seller", value: "Seller" },
  ];

  // Custom styles for react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      border: state.isFocused ? '2px solid #C75D2C' : '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(199, 93, 44, 0.1)' : 'none',
      '&:hover': {
        border: '1px solid #C75D2C'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#C75D2C' : state.isFocused ? '#fef7f4' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      padding: '12px 16px',
      cursor: 'pointer'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#374151'
    })
  };

  const fetchMessages = () => {
    return axios.get(
      `/support?page=${activePage}&perPage=${perPage}&userName=${userName}&userId=${userId}&role=${role}`
    );
  };

  const {
    isLoading: loadingMessags,
    data: messageData,
    refetch,
    isRefetching: refetchingMessages,
  } = useQuery({
    queryKey: [`messages-`, activePage],
    queryFn: fetchMessages,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const totalPages = Math.ceil(messageData?.data?.count / perPage);

  // pagination refetch
  useEffect(() => {
    refetch();
  }, [activePage, perPage, userName, userId, role]);

  // reset filters
  const resetFilters = () => {
    setPerPage(10);
    setPage(1);
    setUserName("");
    setJabberId("");
    setRole("");
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="  px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-[#C75D2C] to-[#C83F12] rounded-lg">
                <HiChatAlt2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#343a40]">Support Center</h1>
                <p className="text-gray-600 mt-1">Manage customer support requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <HiUsers className="h-4 w-4" />
              <span>Total Requests: <span className="font-semibold text-[#C75D2C]">{messageData?.data?.count || 0}</span></span>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <HiSearch className="h-5 w-5 text-[#C75D2C]" />
            <h3 className="text-lg font-semibold text-[#343a40]">Filter Requests</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                placeholder="Enter username..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C75D2C] focus:ring-opacity-20 focus:border-[#C75D2C] transition-all duration-200"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            {/* <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Jabber ID</label>
              <input
                type="text"
                placeholder="Enter Jabber ID..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C75D2C] focus:ring-opacity-20 focus:border-[#C75D2C] transition-all duration-200"
                value={userId}
                onChange={(e) => {
                  setJabberId(e.target.value);
                  setPage(1);
                }}
              />
            </div> */}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">User Role</label>
              <Select
                options={roleOptions}
                styles={selectStyles}
                value={roleOptions.find(option => option.value === role)}
                onChange={(selectOption) => {
                  setRole(selectOption?.value);
                  setPage(1);
                }}
                placeholder="Select role..."
                isClearable
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Results per page</label>
              <Select
                options={perPageOptions}
                styles={selectStyles}
                value={perPageOptions.find(option => option.value === perPage.toString())}
                onChange={(selectOption) => {
                  setPerPage(selectOption?.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
            >
              <HiRefresh className="h-4 w-4 mr-2" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#343a40]">Support Requests</h3>
              <Pagination
                total={totalPages}
                page={activePage}
                onChange={setPage}
                size="sm"
                color="#C75D2C"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#C75D2C] to-[#C83F12]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Username</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold text-white">Jabber ID</th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Action</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {!messageData?.data?.messages || messageData?.data?.messages?.length < 1 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <HiChatAlt2 className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">No support requests found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : loadingMessags || refetchingMessages ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <PulseLoader color="#C75D2C" size={8} />
                        <span className="ml-3 text-gray-600">Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  messageData?.data?.messages?.map((item, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        item?.adminUnread > 0 ? 'bg-orange-50 border-l-4 border-l-[#C75D2C]' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        #{(activePage - 1) * perPage + index + 1}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {item?.adminUnread > 0 ? (
                            <Indicator inline label={item?.adminUnread} size={18} color="#C75D2C">
                              <span className="text-sm font-medium text-gray-900">{item?.userName}</span>
                            </Indicator>
                          ) : (
                            <span className="text-sm text-gray-900">{item?.userName}</span>
                          )}
                          {item?.adminUnread > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#C75D2C] text-white">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {item?.userId}
                      </td> */}
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item?.role === 'Buyer' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item?.role}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/dashboard/messages/${item?.userId}`}
                          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            item?.adminUnread > 0
                              ? 'bg-gradient-to-r from-[#C75D2C] to-[#C83F12] text-white hover:shadow-lg hover:scale-105 shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <HiChatAlt2 className="h-4 w-4 mr-1" />
                          View Chat
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {messageData?.data?.messages?.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Showing {((activePage - 1) * perPage) + 1} to {Math.min(activePage * perPage, messageData?.data?.count)} of{' '}
                  <span className="font-semibold">{messageData?.data?.count}</span> requests
                </p>
                <Pagination
                  total={totalPages}
                  page={activePage}
                  onChange={setPage}
                  size="sm"
                  color="#C75D2C"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSupport;