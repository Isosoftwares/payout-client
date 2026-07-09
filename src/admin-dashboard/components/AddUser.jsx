import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Select from "react-select";
import { MultiSelect } from "@mantine/core";
import useAuth from "../../hooks/useAuth";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import Unauthorized from "../../Unauthorized";

function AddUser({ handleCloseAddModal }) {
  const { auth } = useAuth();
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm();

  const addUser = (data) => {
    return axios.post("/users/admin/users", data);
  };

  const { mutate: userMutate, isPending: loadingAddUser } = useMutation({
    mutationFn: addUser,
    onSuccess: (response) => {
      reset();
      toast.success(response.data.message || "User registered successfully");
      queryClient.invalidateQueries(["agents"]); // Refresh agents list
      if (handleCloseAddModal) {
        handleCloseAddModal();
      }
    },
    onError: (err) => {
      const text = err?.response?.data?.message || "Something went wrong";
      toast.error(text);
    },
  });

  const onSubmitting = async (data) => {
    // Structure data to match API endpoint
    const userData = {
      username: data.username,
      email: data.email,
      password: data.password,
      role: "client",
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
      feePercentage: parseFloat(data.feePercentage) || 0,
    };
    userMutate(userData);
  };

  return (
    <div className="">
      <div className="bg-white ">
        <form onSubmit={handleSubmit(onSubmitting)} className="space-y-6">
          {/* Basic Information */}
          <div className="">
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter username"
                type="text"
                className="input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("username", { required: "Username is required" })}
                disabled={loadingAddUser}
              />
              {errors.username && (
                <p className="text-red-500 text-xs">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter email"
                type="email"
                className="input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
                disabled={loadingAddUser}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter password"
                type="password"
                className="input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                disabled={loadingAddUser}
              />
              {errors.password && (
                <p className="text-red-500 text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter first name"
                type="text"
                className="input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("firstName", {
                  required: "First name is required",
                })}
                disabled={loadingAddUser}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter last name"
                type="text"
                className="input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("lastName", { required: "Last name is required" })}
                disabled={loadingAddUser}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Fee Percentage */}
            <div className="flex flex-col gap-1 mt-4">
              <label className="text-sm font-medium">
                Fee Percentage (%) <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="e.g. 5"
                type="number"
                step="0.01"
                className="input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("feePercentage", { required: "Fee percentage is required", min: 0, max: 100 })}
                disabled={loadingAddUser}
              />
              {errors.feePercentage && (
                <p className="text-red-500 text-xs">
                  {errors.feePercentage.message}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-3 pt-6">
            <button
              disabled={loadingAddUser}
              type="submit"
              className="px-6 py-2 disabled:cursor-not-allowed bg-blue-600 disabled:bg-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
            >
              {loadingAddUser ? "Adding..." : "Add User"}
            </button>

            {handleCloseAddModal && (
              <button
                type="button"
                className="px-6 py-2 bg-gray-600 text-white rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={handleCloseAddModal}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
