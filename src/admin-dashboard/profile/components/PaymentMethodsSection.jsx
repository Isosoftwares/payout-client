import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import {
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  StarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function PaymentMethodsSection({ user }) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [type, setType] = useState('mpesa');
  const [details, setDetails] = useState({});

  const addMutation = useMutation({
    mutationFn: (newMethod) => axios.post('/users/payment-methods', newMethod),
    onSuccess: () => {
      toast.success('Payment method added successfully');
      queryClient.invalidateQueries(['own-profile']);
      resetForm();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add payment method');
    }
  });

  const editMutation = useMutation({
    mutationFn: (updatedMethod) => axios.put(`/users/payment-methods/${editingId}`, updatedMethod),
    onSuccess: () => {
      toast.success('Payment method updated successfully');
      queryClient.invalidateQueries(['own-profile']);
      resetForm();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update payment method');
    }
  });

  const defaultMutation = useMutation({
    mutationFn: (methodId) => axios.patch(`/users/payment-methods/${methodId}/default`),
    onSuccess: () => {
      toast.success('Default payment method updated');
      queryClient.invalidateQueries(['own-profile']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to set default method');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (methodId) => axios.delete(`/users/payment-methods/${methodId}`),
    onSuccess: () => {
      toast.success('Payment method deleted successfully');
      queryClient.invalidateQueries(['own-profile']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete payment method');
    }
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setType('mpesa');
    setDetails({});
  };

  const handleEdit = (method) => {
    setIsAdding(true);
    setEditingId(method._id);
    setType(method.type);
    setDetails(method.details);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      editMutation.mutate({ type, details });
    } else {
      addMutation.mutate({ type, details });
    }
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const getNetworks = (currency) => {
    switch (currency) {
      case 'USDT': return ['TRC20', 'ERC20', 'BEP20', 'Polygon'];
      case 'USDC': return ['ERC20', 'TRC20', 'Solana', 'Polygon'];
      case 'BTC': return ['Bitcoin'];
      case 'ETH': return ['ERC20'];
      default: return [];
    }
  };

  const currentNetworks = getNetworks(details.currency);

  const getMethodIcon = (methodType) => {
    switch (methodType) {
      case 'mpesa': return <DevicePhoneMobileIcon className="h-6 w-6 text-green-500" />;
      case 'bank': return <BanknotesIcon className="h-6 w-6 text-blue-500" />;
      // case 'crypto': return <CurrencyDollarIcon className="h-6 w-6 text-purple-500" />;
      default: return <CreditCardIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CreditCardIcon className="h-6 w-6 mr-3 text-primary" />
          Payment Methods
        </h3>
        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-medium rounded-lg transition-colors duration-200 text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add New
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">{editingId ? 'Edit Payment Method' : 'Add Payment Method'}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method Type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setDetails({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              >
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                {/* <option value="crypto">Cryptocurrency</option> */}
              </select>
            </div>

            {type === 'mpesa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={details.name || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={details.phone || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. +254712345678"
                  />
                </div>
              </div>
            )}

            {type === 'bank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    required
                    value={details.bankName || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. KCB Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    required
                    value={details.accountName || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    required
                    value={details.accountNumber || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Currency</label>
                  <select
                    name="bankCurrency"
                    required
                    value={details.bankCurrency || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Currency</option>
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code / SWIFT</label>
                  <input
                    type="text"
                    name="branchCode"
                    value={details.branchCode || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}

            {/* type === 'crypto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    name="currency"
                    required
                    value={details.currency || ''}
                    onChange={(e) => {
                      handleDetailChange(e);
                      setDetails(prev => ({ ...prev, network: '' }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Currency</option>
                    <option value="USDT">USDT (Tether)</option>
                    <option value="USDC">USDC (USD Coin)</option>
                    <option value="BTC">BTC (Bitcoin)</option>
                    <option value="ETH">ETH (Ethereum)</option>
                  </select>
                </div>
                
                {details.currency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
                    <select
                      name="network"
                      required
                      value={details.network || ''}
                      onChange={handleDetailChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Network</option>
                      {currentNetworks.map(net => (
                        <option key={net} value={net}>{net}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={details.address || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter wallet address"
                  />
                </div>
              </div>
            ) */}

            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                disabled={addMutation.isLoading || editMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition-colors"
                disabled={addMutation.isLoading || editMutation.isLoading}
              >
                {(addMutation.isLoading || editMutation.isLoading) ? 'Saving...' : 'Save Method'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {(!user?.paymentMethods || user.paymentMethods.length === 0) ? (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            No payment methods added yet.
          </div>
        ) : (
          user.paymentMethods.map((method) => (
            <div key={method._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary/50 transition-colors bg-white">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getMethodIcon(method.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-gray-900 capitalize">
                      {method.type === 'mpesa' ? 'M-Pesa' : method.type === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}
                    </h4>
                    {method.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckBadgeIcon className="h-3 w-3 mr-1" /> Default
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
              <div className="mt-4 sm:mt-0 ml-0 sm:ml-4 flex items-center space-x-2">
                {!method.isDefault && (
                  <button
                    onClick={() => defaultMutation.mutate(method._id)}
                    className="text-gray-400 hover:text-yellow-500 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                    title="Set as Default"
                    disabled={defaultMutation.isLoading}
                  >
                    <StarIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(method)}
                  className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Edit Method"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    if(window.confirm('Are you sure you want to delete this payment method?')) {
                      deleteMutation.mutate(method._id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete Method"
                  disabled={deleteMutation.isLoading}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
