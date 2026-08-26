import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function Subaccounts() {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: subaccountsData, isLoading } = useQuery({
    queryKey: ['subaccounts'],
    queryFn: () => axios.get('/subaccounts'),
  });

  const subaccounts = subaccountsData?.data?.data || [];

  const { mutate: addSubaccount, isPending } = useMutation({
    mutationFn: (data) => axios.post('/subaccounts', data),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Subaccount created successfully');
      queryClient.invalidateQueries(['subaccounts']);
      setShowAddModal(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create subaccount'),
  });

  const { mutate: deleteSubaccount } = useMutation({
    mutationFn: (id) => axios.delete(`/subaccounts/${id}`),
    onSuccess: (res) => {
      toast.success('Subaccount deleted successfully');
      queryClient.invalidateQueries(['subaccounts']);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete subaccount'),
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this subaccount?")) {
      deleteSubaccount(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broker Subaccounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create subaccounts to safely allocate claimed payout names to specific entities.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
          >
            Create Subaccount
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Created Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="3" className="p-6 text-center text-gray-500">Loading subaccounts...</td></tr>
            ) : subaccounts.length === 0 ? (
              <tr><td colSpan="3" className="p-6 text-center text-gray-500">No subaccounts created yet.</td></tr>
            ) : (
              subaccounts.map(sub => (
                <tr key={sub._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sub.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleDelete(sub._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create Subaccount</h2>
            <form onSubmit={handleSubmit((d) => addSubaccount(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Username <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  {...register('username', { required: true })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {errors.username && <span className="text-xs text-red-500">Required</span>}
              </div>
              <div>
                <label className="block text-sm font-medium">Password <span className="text-red-500">*</span></label>
                <input 
                  type="password"
                  {...register('password', { required: true, minLength: 6 })} 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                />
                {errors.password && <span className="text-xs text-red-500">Minimum 6 characters</span>}
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isPending ? 'Creating...' : 'Create Subaccount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
