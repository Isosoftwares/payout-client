import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import axios from "./api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "@mantine/core";
import { Helmet } from "react-helmet-async";

const ResetPassword = () => {
  const { userType, userId, resetString } = useParams();

  const [visiblePassword, setVisiblePassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  // Mutation function with correct v5 syntax
  const resetPasswordMutation = useMutation({
    mutationFn: (data) => axios.patch("/reset-password", data),
    onSuccess: (response) => {
      reset();
      toast.success(response.data.message);
      navigate("/login", { replace: true });
    },
    onError: (err) => {
      const text = err?.response?.data?.message || "Something went wrong";
      toast.error(text);
    },
  });

  // Query function with correct v5 syntax
  const resetPasswordQuery = useQuery({
    queryKey: ['reset-password', userId],
    queryFn: () => axios.get(`/reset-password/${userId}`),
    enabled: !!userId,
  });

  const onSubmitting = (data) => {
    const submissionData = {
      ...data,
      userType,
      userId,
      resetString,
    };

    resetPasswordMutation.mutate(submissionData);
  };

  const isLinkExpired = () => {
    if (!resetPasswordQuery.data) return true;
    const expiresAt = new Date(resetPasswordQuery.data?.data?.expiresAt);
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    return expiresAt < threeHoursAgo;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center p-4">
      <Helmet>
        <title>Reset Password</title>
      </Helmet>
      
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 transform transition-all hover:scale-105 duration-300">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-6 text-center">
          Reset Password
        </h1>

        {resetPasswordQuery.isLoading ? (
          <div className="flex justify-center">
            <Loader color="blue" size="lg" />
          </div>
        ) : !resetPasswordQuery.data || isLinkExpired() || resetPasswordQuery?.data?.data?.isUsed ? (
          <div className="text-center">
            <p className="text-red-500 font-semibold mb-4">
              This reset link has EXPIRED or has already been used.
            </p>
            <p className="text-gray-600 italic">
              If this was not you, please contact support.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmitting)} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-gray-700 font-bold mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={visiblePassword ? "text" : "password"}
                  {...register("password", {
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`w-full p-3 border rounded-lg ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  onClick={() => setVisiblePassword(!visiblePassword)}
                >
                  {visiblePassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-bold mb-2">
                Confirm Password
              </label>
              <input
                type={visiblePassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
                className={`w-full p-3 border rounded-lg ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className={`w-full p-3 rounded-lg text-white font-bold transition-all duration-300 ${
                resetPasswordMutation.isPending
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {resetPasswordMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <Loader color="white" size="sm" />
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;