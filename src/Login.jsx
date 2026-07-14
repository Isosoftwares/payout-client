import React, { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useAuth from "./hooks/useAuth";
import axios from "./api/axios";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

function Login() {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState("");
  const { setAuth } = useAuth();
  const [visiblePassword, setVisiblePassword] = useState(false);

  const toDash = "/dashboard";
  const toClient = "/client";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const login = (loginData) => {
    return axios.post("/auth/login", loginData, {
      withCredentials: true // Ensure cookies are included
    });
  };

  const { mutate: loginMutate, isPending: loginLoading, error } = useMutation({
    mutationFn: login,
    onSuccess: (response) => {

      const accessToken = response?.data?.data?.accessToken;
      const user = response?.data?.data?.user;
      const roles = [user?.role];
      const userId = user?._id;

      setAuth({
        roles,
        accessToken,
        user,
        userId,
      });

      // No longer store userId in localStorage - using httpOnly cookies instead
      
      const text = `Welcome back ${user?.username || ""}`;

      if (user?.mustChangePassword) {
        toast.info("Please change your password to continue");
        return navigate("/change-password", { replace: true });
      }

      // Navigate based on role
      if (roles?.includes("admin")) {
        toast.success(text);
       return navigate(toDash, { replace: true });
      }
      if (roles?.includes("client")) {
        toast.success(text);
       return navigate(toClient, { replace: true });
      }
    },
    onError: (err) => {
      console.log(err)
      const text =
        err?.response?.data?.message || "Something went wrong";
      setErrMsg(text);
      setTimeout(() => {
        setErrMsg("");
      }, 10000);
      toast.error(text);
    },
  });

  const onSubmitting = async (data) => {
    try {
      loginMutate(data);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F5" }}>
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-2 pt-[90px]">
        <div className="">
          <div
            className="grid grid-cols-1  gap-0 rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "#FFF",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Right Side - Login Form */}
            <div className="p-12 lg:p-10 flex items-center">
              <div className="w-full  mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                  <div
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: "rgba(50, 100, 255, 0.1)",
                      color: "#3264ff",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-3"
                      style={{ backgroundColor: "#3264ff" }}
                    ></div>
                    Sign In to Your Account
                  </div>

                  <h2
                    className="text-3xl font-bold"
                    style={{ color: "#343a40" }}
                  >
                    Welcome Back
                  </h2>
                  <p style={{ color: "#343a40", opacity: 0.7 }}>
                    Enter your credentials to access dashboard
                  </p>
                </div>

                {/* Error Message */}
                {errMsg && (
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #ef4444",
                    }}
                  >
                    <p className="text-red-600 text-sm">{errMsg}</p>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmitting)}
                  className="space-y-6"
                >
                  {/* Email Field */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "#343a40" }}
                    >
                      Email Address
                    </label>
                    <input
                      className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.email
                          ? "border-red-500 focus:border-red-500"
                          : "focus:border-blue-500"
                      }`}
                      style={{
                        backgroundColor: errors.email ? "#fef2f2" : "#F5F5F5",
                        borderColor: errors.email ? "#ef4444" : "#cdc7ecea",
                      }}
                      type="email"
                      placeholder="Enter your email address"
                      disabled={loginLoading}
                      {...register("email", {
                        required: "Email is required",
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "#343a40" }}
                    >
                      Password
                    </label>
                    <div
                      className={`flex items-center border-2 rounded-xl transition-all duration-300 ${
                        errors.password
                          ? "border-red-500"
                          : "focus-within:border-blue-500"
                      }`}
                      style={{
                        backgroundColor: errors.password
                          ? "#fef2f2"
                          : "#F5F5F5",
                        borderColor: errors.password ? "#ef4444" : "#cdc7ecea",
                      }}
                    >
                      <input
                        type={visiblePassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="flex-1 px-4 py-2 bg-transparent outline-none"
                        disabled={loginLoading}
                        {...register("password", {
                          required: "Password is required",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setVisiblePassword(!visiblePassword)}
                        className="px-4 transition-colors duration-300"
                        style={{ color: "#343a40", opacity: 0.7 }}
                        disabled={loginLoading}
                      >
                        {visiblePassword ? (
                          <AiOutlineEyeInvisible size={20} />
                        ) : (
                          <AiOutlineEye size={20} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                 

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ backgroundColor: "#3264ff" }}
                    onMouseEnter={(e) =>
                      !loginLoading &&
                      (e.target.style.backgroundColor = "#2451cc")
                    }
                    onMouseLeave={(e) =>
                      !loginLoading &&
                      (e.target.style.backgroundColor = "#3264ff")
                    }
                  >
                    {loginLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing In...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;