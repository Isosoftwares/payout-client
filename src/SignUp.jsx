import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Helmet } from "react-helmet-async";
import axios from "./api/axios";
import { Loader } from "@mantine/core";
import useAuth from "./hooks/useAuth";

function SignUp() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [visiblePassword, setVisiblePassword] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const toDash = "/dashboard";
  const toClient = "/client"; 

  const signUp = (signupData) => {
    return axios.post("/auth/register", signupData, {
      withCredentials: true // Ensure cookies are included for auto-login
    });
  };

  const { mutate: signupMutate, isPending: loadingSignup, error } = useMutation({
    mutationFn: signUp,

    onSuccess: (response) => {
      const accessToken = response?.data?.data?.accessToken;
      const user = response?.data?.data?.user;
      const roles = [user?.role];
      const userId = user?._id;

      // Set auth context to log user in automatically
      setAuth({
        roles,
        accessToken,
        user,
        userId,
      });

      // Clear form and error messages
      reset();
      setErrMsg("");

      const text = response?.data?.message || `Welcome ${user?.username || user?.email || ""}! Account created successfully`;
      toast.success(text);

      // Navigate based on role - assuming clients go to client dashboard
      if (roles?.includes("client")) {
        navigate(toClient, { replace: true });
      } else if (roles?.includes("admin")) {
        navigate(toDash, { replace: true });
      } else {
        // Default navigation for other roles
        navigate("/dashboard", { replace: true });
      }
    },
    onError: (err) => {
      const text =
        err?.response?.data?.error?.message || 
        err?.response?.data?.message ||
        "Something went wrong";
      setErrMsg(text);
      setTimeout(() => {
        setErrMsg("");
      }, 10000);
      toast.error(text);
    },
  });

  const onSubmitting = async (data) => {
    try {
      signupMutate(data);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F5" }}>
      <Helmet>
        <title> Rarevision</title>
      </Helmet>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4  lg:pt-[90px]">
        <div className="w-full max-w-6xl">
          <div
            className="grid  gap-0 rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "#FFF",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Left Side - Registration Form */}
            <div className="p-12 lg:p-16 flex items-center">
              <div className="w-full max-w-md mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
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
                    Join Rarevision Today
                  </div>

                  <h2
                    className="text-3xl font-bold"
                    style={{ color: "#343a40" }}
                  >
                    Create Your Account
                  </h2>
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
                      disabled={loadingSignup}
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
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
                        placeholder="Create a strong password"
                        className="flex-1 px-4 py-2 bg-transparent outline-none"
                        disabled={loadingSignup}
                        {...register("password", {
                          required: "Password is required",
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                          }
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setVisiblePassword(!visiblePassword)}
                        className="px-4 transition-colors duration-300"
                        style={{ color: "#343a40", opacity: 0.7 }}
                        disabled={loadingSignup}
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
                    disabled={loadingSignup}
                    className="w-full py-2 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ backgroundColor: "#3264ff" }}
                    onMouseEnter={(e) =>
                      !loadingSignup &&
                      (e.target.style.backgroundColor = "#2451cc")
                    }
                    onMouseLeave={(e) =>
                      !loadingSignup &&
                      (e.target.style.backgroundColor = "#3264ff")
                    }
                  >
                    {loadingSignup ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center">
                      <div
                        className="w-full border-t"
                        style={{ borderColor: "#cdc7ecea" }}
                      ></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span
                        className="px-4 bg-white"
                        style={{ color: "#343a40", opacity: 0.6 }}
                      >
                        Already have an account?
                      </span>
                    </div>
                  </div>

                  {/* Sign In Link */}
                  <Link
                    to="/login"
                    className="w-full py-2 border-2 font-semibold rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                    style={{
                      color: "#3264ff",
                      borderColor: "#cdc7ecea",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "#3264ff";
                      e.target.style.backgroundColor =
                        "rgba(50, 100, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "#cdc7ecea";
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    Sign In Instead
                  </Link>
                </form>
              </div>
            </div>

           
          </div>
        </div>
      </div>

    </div>
  );
}

export default SignUp;