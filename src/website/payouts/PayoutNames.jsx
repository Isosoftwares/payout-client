import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function PayoutNames() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleAccounts, setVisibleAccounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['client-virtual-accounts'],
    queryFn: () => axios.get('/virtual-accounts'),
    onError: (err) => toast.error('Failed to load accounts'),
  });

  const accounts = accountsData?.data?.data || [];

  const { mutate: createAccount, isPending } = useMutation({
    mutationFn: (data) => axios.post('/virtual-accounts', data),
    onSuccess: () => {
      toast.success('Payout Name created successfully');
      queryClient.invalidateQueries(['client-virtual-accounts']);
      setShowCreateModal(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create account'),
  });

  const toggleVisibility = (id) => {
    setVisibleAccounts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAccounts = accounts.filter((acc) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${acc.firstName} ${acc.lastName}`.toLowerCase();
    const identifier = (acc.identifier || '').toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || identifier.includes(searchLower);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && acc.status === statusFilter;
  }).sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Names</h1>
          <p className="mt-1 text-sm text-gray-500">Create names to receive payments. Admins will assign bank details shortly after.</p>
        </div>
      </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or identifier..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full sm:w-40 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_bank_details">Pending Details</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap text-sm"
          >
            Create New Name
          </button>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-500 col-span-full">Loading accounts...</p>
        ) : filteredAccounts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">No payout names found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search term or create a new payout name.</p>
          </div>
        ) : (
          paginatedAccounts.map(acc => (
            <div key={acc._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">{acc.firstName} {acc.lastName}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  acc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {acc.status === 'active' ? 'Active' : 'Pending Details'}
                </span>
              </div>
              <div className="px-6 py-5 space-y-4">
                {acc.identifier && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Identifier</p>
                    <p className="font-medium text-gray-900">{acc.identifier}</p>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Balance</p>
                    <p className="font-medium text-gray-900">${(acc.withdrawableBalance <= 0 ? 0 : acc.balance || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Withdrawable</p>
                    <p className="font-bold text-blue-600">${(acc.withdrawableBalance || 0).toFixed(2)}</p>
                  </div>
                </div>
                
                {acc.status === 'active' && acc.bankDetails && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-4 text-sm border border-gray-100">
                    <p className="text-gray-500 mb-1">Assigned Details:</p>
                    <p className="font-medium text-gray-900">{acc.bankDetails.bankName}</p>
                    <p className="text-gray-600">RTN: {acc.bankDetails.routingNumber}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">
                        ACC: {visibleAccounts[acc._id] ? acc.bankDetails.accountNumber : `••••${acc.bankDetails.accountNumber?.slice(-4)}`}
                      </p>
                      <button 
                        onClick={() => toggleVisibility(acc._id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium focus:outline-none"
                      >
                        {visibleAccounts[acc._id] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAccounts.length)}</span> of{' '}
                <span className="font-medium">{filteredAccounts.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === idx + 1 ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create Payout Name</h2>
            <form onSubmit={handleSubmit((d) => createAccount(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                <input {...register('firstName', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                <input {...register('lastName', { required: true })} className="w-full mt-1 px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">Internal Identifier (Optional)</label>
                <input {...register('identifier')} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="e.g. LLC, LLC-2" />
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isPending ? 'Creating...' : 'Create Payout Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
