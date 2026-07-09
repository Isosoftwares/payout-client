import { Loader } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "./api/axios";
import LoadingSpinner from "./components/LoadingSpinner";
import { Helmet } from "react-helmet-async";

function VerifyEmail() {
  const { clientId, uniqueString } = useParams();
  const navigate = useNavigate();

  // upload function
  const verifyEmail = (data) => {
    return axios.patch(
      `/email-verification/verify/${clientId}/${uniqueString}`,
      data
    );
  };

  const {
    mutate: emailVerificationMutate,
    isLoading: emailVerificationLoading,
    error,
  } = useMutation(verifyEmail, {
    onSuccess: (response) => {
      toast.success(response?.data?.message);
      navigate("/login", { replace: true });
    },
    onError: (err) => {
      const text = err?.response?.data?.message;
      toast.error(text);

      if (!err.response.data.message) {
        toast.error("something went wrong");
      }
    },
  });

  // upload function
  const requestNewVferifyLink = (data) => {
    return axios.patch(
      `/email-verification/request/verification/${clientId}`,
      data
    );
  };

  const { mutate: newLinkMutate, isLoading: newLinkLoading } = useMutation(
    requestNewVferifyLink,
    {
      onSuccess: (response) => {
        toast.success(response?.data?.message);
        navigate("/login", { replace: true });
      },
      onError: (err) => {
        const text = err?.response?.data?.message;
        toast.error(text);

        if (!err.response.data.message) {
          toast.error("something went wrong");
        }
      },
    }
  );

  const onSubmitting = () => {
    emailVerificationMutate();
  };

  const onRequestingNewLink = () => {
    newLinkMutate();
  };

  //   get email verification
  const getEmailverification = () => {
    return axios.get(`/email-verification/${clientId}`);
  };

  const {
    isLoading: loadingEmailVerification,
    data: emailVerificationData,
    refetch,
  } = useQuery([`verification-${clientId}`, clientId], getEmailverification, {
    enabled: !!clientId,
  });

  return (
    <>
      <Helmet>
        <title>Verify Email | My Content Way</title>
      </Helmet>
      {loadingEmailVerification ? (
        <div className="flex justify-center items-center md:min-h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-blue-200 min-h-screen">
          <div className=" pt-8 md:pt-0 md:min-h-[70vh]  flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h1 className=" text-xl md:text-3xl font-bold mb-4">
                My Content Way
              </h1>
              {emailVerificationData?.data?.isVerified ? (
                <div className="flex flex-col  gap-y-4">
                  <h1>
                    Your email is already{" "}
                    <span className="text-green-500 uppercase font-bold">
                      verified
                    </span>
                  </h1>
                  <button
                    className="bg-primary hover:opacity-80 text-white px-2 py-1 rounded-md shadow-md"
                    onClick={() => navigate("/login", { replace: true })}
                  >
                    Go to Login
                  </button>
                </div>
              ) : new Date(emailVerificationData?.data?.expiresAt) >
                Date.now() - 3 * 60 * 60 * 1000 ? (
                <p className="text-gray-700 mb-8">
                  Please verify your email address to continue:
                </p>
              ) : (
                <p className="text-gray-700 mb-8">
                  The link has{" "}
                  <span className="text-red-500 font-bold">EXPIRED</span>, click
                  the button below to request new link:
                </p>
              )}
              {emailVerificationLoading || newLinkLoading ? (
                <div className="flex justify-center items-center">
                  <Loader color="yellow" />
                </div>
              ) : (
                <div
                  className={`${
                    emailVerificationData?.data?.isVerified && "hidden"
                  } flex space-x-4`}
                >
                  {new Date(emailVerificationData?.data?.expiresAt) >
                  Date.now() - 3 * 60 * 60 * 1000 ? (
                    <button
                      className="bg-primary hover:opacity-80 text-white px-4 py-2 rounded-md shadow-md"
                      onClick={() => onSubmitting()}
                    >
                      Verify Email
                    </button>
                  ) : (
                    <button
                      className="bg-primary hover:opacity-80 text-white px-4 py-2 rounded-md shadow-md"
                      onClick={() => onRequestingNewLink()}
                    >
                      Request New Link
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VerifyEmail;
