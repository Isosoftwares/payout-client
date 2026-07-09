import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import useAuth from "./hooks/useAuth";
import axios from "./api/axios";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";

function ChangePassword() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const changePassword = (data) => {
    return axios.post("/auth/change-password", data, {
      headers: { Authorization: `Bearer ${auth?.accessToken}` },
      withCredentials: true
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setAuth(prev => ({
        ...prev,
        user: { ...prev.user, mustChangePassword: false }
      }));
      if (auth?.roles?.includes("admin")) navigate("/dashboard", { replace: true });
      else navigate("/client", { replace: true });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  });

  const onSubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Change Password Required</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">Your admin has required you to change your password before continuing.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border rounded-xl"
              {...register("currentPassword", { required: true })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border rounded-xl"
              {...register("newPassword", { required: true, minLength: 6 })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border rounded-xl"
              {...register("confirmPassword", { required: true })} 
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
          >
            {isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
