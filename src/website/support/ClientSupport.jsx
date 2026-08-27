import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../hooks/useAuth";
import { useForm } from "react-hook-form";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import PulseLoader from "react-spinners/PulseLoader";
import { format } from "timeago.js";
import { ChatBubbleLeftRightIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Skeleton } from "@mantine/core";

function ClientSupport() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const scroll = useRef();
  const messagesEndRef = useRef();
  const [sent, setSent] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const messageText = watch("message", "");

  //get conversation......................
  function getConversation() {
    return axios.get(`/support/messages/customer/${auth?.userId}`);
  }
  
  // querying function
  const {
    data: conversationData,
    isLoading: loadingConversation,
    isError: errorConversation,
    refetch,
  } = useQuery({
    queryKey: [`messages-${auth?.userId}`],
    queryFn: getConversation,
    refetchInterval: 2000, // Auto-refresh every 2 seconds
    refetchOnWindowFocus: true,
  });

  // upload function
  const uploadMessage = (message) => {
    return axios.post("/support", message);
  };

  const {
    mutate: messageMutate,
    isPending: messageLoading,
    error,
  } = useMutation({
    mutationFn: uploadMessage,
    onSuccess: (response) => {
      toast.success(response?.data?.message || "Message sent successfully!");
      queryClient.invalidateQueries([`messages-${auth?.userId}`]);
      reset();
      setSent(Date.now());
    },
    onError: (err) => {
      const text = err?.response?.data?.message;
      toast.error(text || "Something went wrong. Please try again.");
    },
  });

  const submitMessage = (data) => {
    if (!data.message.trim()) return;
    
    const payload = {
      message: data.message,
      userId: auth?.userId,
      role: auth?.roles?.[0] || 'client',
      userName: auth?.user?.profile?.firstName || auth?.user?.username || auth?.user?.email?.split("@")[0] || "Customer"
    };

    console.log("Submitting support message:", payload);
    messageMutate(payload);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.data?.messages?.length, sent]);

  // Auto scroll when component mounts
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  if (errorConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">Unable to load your support conversation. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="bg-[#C75D2C] text-white px-6 py-2 rounded-lg hover:bg-[#C83F12] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-[#C75D2C] to-[#C83F12] rounded-xl">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#343a40]">Support Chat</h1>
                <p className="text-gray-600 mt-1">Get help from our support team</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Online Support</span>
            </div>
          </div>
        </div>

      

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full overflow-y-auto p-4" style={{ paddingBottom: "140px" }}>
            {loadingConversation ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                      <Skeleton height={40} circle />
                      <div className="flex-1">
                        <Skeleton height={60} radius="lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !conversationData?.data?.messages || conversationData?.data?.messages?.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-500 max-w-sm">Send us a message below and our support team will get back to you shortly.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationData?.data?.messages?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.from === (auth?.roles?.[0] || 'client') ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.from === (auth?.roles?.[0] || 'client')
                          ? "bg-gradient-to-r from-[#C75D2C] to-[#C83F12] text-white rounded-br-sm"
                          : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-sm"
                      } relative`}
                    >
                      <div className="flex flex-col">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                          {message?.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${
                            message.from === (auth?.roles?.[0] || 'client')
                              ? "text-orange-100" 
                              : "text-gray-500"
                          }`}>
                            {message?.createdAt ? format(message?.createdAt) : ""}
                          </span>
                          {message.from === (auth?.roles?.[0] || 'client') && (
                            <span className="text-xs text-orange-100 ml-2">You</span>
                          )}
                          {message.from === "Admin" && (
                            <span className="text-xs text-gray-500 ml-2 font-medium">Support</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit(submitMessage)} className="space-y-3">

            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  {...register("message", { 
                    required: "Please enter a message",
                    validate: value => value.trim().length > 0 || "Message cannot be empty",
                    maxLength: { value: 1000, message: "Message is too long (max 1000 characters)" }
                  })}
                  placeholder="Type your message here... Be specific about your issue and include relevant details."
                  className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-[#C75D2C] focus:ring-opacity-20 focus:border-[#C75D2C] transition-all duration-200 bg-white"
                  rows="3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(submitMessage)();
                    }
                  }}
                />
                <div className="absolute bottom-3 right-12 text-xs text-gray-400">
                  {messageText.length}/1000
                </div>
              </div>
              
              <button
                type="submit"
                disabled={messageLoading || !messageText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#C75D2C] to-[#C83F12] text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center space-x-2 self-end"
              >
                {messageLoading ? (
                  <PulseLoader color="white" size={6} />
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    <span className="hidden sm:block">Send</span>
                  </>
                )}
              </button>
            </div>
            
            {errors.message && (
              <p className="text-red-500 text-sm mt-1 ml-1">{errors.message.message}</p>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Messages refresh automatically</span>
            </div>
          </form>
        </div>

       
      </div>
    </div>
  );
}

export default ClientSupport;