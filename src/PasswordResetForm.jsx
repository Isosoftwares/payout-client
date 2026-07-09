import React, { useState, useEffect } from "react";
import NavBar from "./components/NavBar";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "./api/axios";
import { Loader } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import Footer from "./components/Footer";

const PasswordResetForm = () => {
  const [email, setEmail] = useState("");
  const [requestLink, setRequestLink] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const cooldownDuration = 100; // 300 seconds (5 minutes)

  useEffect(() => {
    const hasRequestedLink = localStorage.getItem("emailLinkRequested");
    const lastRequestedTime = parseInt(
      localStorage.getItem("lastRequestedTime")
    );
    if (hasRequestedLink && lastRequestedTime) {
      const currentTime = Date.now();
      const elapsedTime = Math.floor((currentTime - lastRequestedTime) / 1000);
      if (elapsedTime < cooldownDuration) {
        setRemainingTime(cooldownDuration - elapsedTime);
        setRequestLink(true);
        startCooldownTimer(cooldownDuration - elapsedTime);
      } else {
        setRequestLink(false);
        localStorage.removeItem("emailLinkRequested");
        localStorage.removeItem("lastRequestedTime");
      }
    }
  }, []);

  const startCooldownTimer = (remainingTime) => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    // Clear the interval when the component unmounts or the cooldown ends.
    setTimeout(() => {
      clearInterval(timer);
      setRequestLink(false);
      setRemainingTime(0);
      localStorage.removeItem("emailLinkRequested");
      localStorage.removeItem("lastRequestedTime");
    }, remainingTime * 1000);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const resetPassword = (data) => {
    return axios.post("/reset-password", data);
  };

  const {
    mutate: resetPasswordMutate,
    isPending: resetPasswordLoading,
    error,
  } = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      handleVerifyEmail();
      reset();

      toast.success(response.data.message);
    },
    onError: (err) => {
      const text = err?.response.data.message || "something went wrong";

      toast.error(text);
    },
  });

  const onSubmitting = (data) => {
    data.userType = "client";

    resetPasswordMutate(data);
  };

  const handleVerifyEmail = () => {
    if (!requestLink) {
  

      // Set the requestLink state to true to indicate that the user has requested a link.
      setRequestLink(true);

      // Store the information in localStorage to remember that the user has requested a link.
      localStorage.setItem("emailLinkRequested", true);
      localStorage.setItem("lastRequestedTime", Date.now());

      // Start the cooldown timer to disable the button for the cooldown duration.
      startCooldownTimer(cooldownDuration);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div>
      <Helmet>
        <title>Reset Password</title>
      </Helmet>
      <div className="min-h-[80vh]  bg-blue-200 flex items-center justify-center">
        <NavBar />
        <div className="bg-white p-8 md:w-[40%] rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-4">Password Reset</h1>
          <form onSubmit={handleSubmit(onSubmitting)}>
            <div className="">
              <label
                htmlFor="email"
                className="block text-gray-700 font-bold mb-1"
              >
                Email
              </label>
              <input
                type="email"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500"
                placeholder="Enter your email"
                disabled={requestLink}
                {...register("email", {
                  required: true,
                })}
              />
            </div>
            <p className="text-red-500 text-sm">
              {errors.email?.type === "required" && "Email is required"}
            </p>
            {resetPasswordLoading ? (
              <div className="flex justify-center items-center pt-4">
                <Loader color="yellow" />
              </div>
            ) : (
              <button
                type="submit"
                disabled={requestLink}
                className={`bg-blue-500 mt-4 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md ${
                  requestLink ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {requestLink
                  ? `Link Requested (Cooldown: ${formatTime(remainingTime)})`
                  : "Reset Password"}
              </button>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PasswordResetForm;
