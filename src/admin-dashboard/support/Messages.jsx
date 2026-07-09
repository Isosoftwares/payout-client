import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import PulseLoader from "react-spinners/PulseLoader";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ArrowLeftIcon, UserIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Loader, Modal, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { format } from "timeago.js";

function Messages() {
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const { userId } = useParams();
  const [messageId, setMessageId] = useState("");
  const [sent, setSent] = useState("");
  const scroll = useRef();
  const messagesEndRef = useRef();

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
    return axios.get(`/support/messages/admin/${userId}`);
  }
  
  // querying function
  const {
    data: conversationData,
    isLoading: loadingConversation,
    isError: errorConversation,
  } = useQuery({
    queryKey: [`messages-${userId}`],
    queryFn: getConversation,
    refetchInterval: 1000,
  });

  // upload function
  const uploadMessage = (message) => {
    return axios.post("/support", message);
  };

  const {
    mutate: messageMutate,
    isLoading: messageLoading,
    error,
  } = useMutation({
    mutationFn: uploadMessage,
    onSuccess: (response) => {
      toast.success(response?.data?.message);
      queryClient.invalidateQueries([`messages-${userId}`]);
      reset();
      setSent(Date.now());
    },
    onError: (err) => {
      const text = err?.response?.data?.message;
      toast.error(text || "Something went wrong");
    },
  });

  const submitMessage = (data) => {
    if (!data.message.trim()) return;
    messageMutate(data);
  };

  // delete message function
  const deleteMessage = (message) => {
    return axios.patch("/support/delete/message", message);
  };

  const { mutate: deleteMutate, isLoading: deleteLoading } = useMutation({
    mutationFn: deleteMessage,
    onSuccess: (response) => {
      toast.success(response?.data?.message);
      queryClient.invalidateQueries([`messages--`]);
      queryClient.invalidateQueries([`messages-${userId}`]);
      close();
    },
    onError: (err) => {
      const text = err?.response?.data?.message;
      toast.error(text || "Something went wrong");
    },
  });

  const onDelete = () => {
    const data = {
      messageId: messageId,
      conversationId: conversationData?.data?._id
    };
    deleteMutate(data);
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
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Conversation</h2>
          <p className="text-gray-600 mb-4">Unable to load the conversation. Please try again.</p>
          <button
            onClick={() => navigate("/dashboard/supports")}
            className="bg-[#C75D2C] text-white px-6 py-2 rounded-lg hover:bg-[#C83F12] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Delete Confirmation Modal */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="font-semibold">Delete Message</span>
          </div>
        }
        centered
        radius="lg"
      >
        <div className="pt-2">
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={close}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              disabled={deleteLoading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
            >
              {deleteLoading ? (
                <PulseLoader color="white" size={4} className="mr-2" />
              ) : (
                <TrashIcon className="h-4 w-4 mr-1" />
              )}
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <div className="container mx-auto max-w-4xl h-[80vh]  flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard/supports")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-[#C75D2C] to-[#C83F12] rounded-lg">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#343a40]">
                    {conversationData?.data?.userName || "Loading..."}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {conversationData?.data?.role} • ID: {userId}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Chat</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full overflow-y-auto p-4" style={{ paddingBottom: "120px" }}>
            {loadingConversation ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton height={40} circle />
                    <div className="flex-1">
                      <Skeleton height={60} radius="lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationData?.data?.messages?.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Start the conversation by sending a message below.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationData?.data?.messages?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.from === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.from === "admin"
                          ? "bg-gradient-to-r from-[#C75D2C] to-[#C83F12] text-white rounded-br-sm"
                          : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-sm"
                      } group relative`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message?.message}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-xs ${
                              message.from === "admin" 
                                ? "text-orange-100" 
                                : "text-gray-500"
                            }`}>
                              {message?.createdAt ? format(message?.createdAt) : ""}
                            </span>
                            {message?.from === "admin" && (
                              <button
                                onClick={() => {
                                  setMessageId(message?._id);
                                  open();
                                }}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black hover:bg-opacity-20 rounded"
                                title="Delete message"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
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
            {/* Hidden fields */}
            <input
              type="hidden"
              value={userId}
              {...register("userId", { required: true })}
            />
            <input
              type="hidden"
              value={auth?.roles[0]}
              {...register("role", { required: true })}
            />
            <input
              type="hidden"
              value={"admin"}
              {...register("userName", { required: true })}
            />

            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  {...register("message", { 
                    required: "Message cannot be empty",
                    validate: value => value.trim().length > 0 || "Message cannot be empty"
                  })}
                  placeholder="Type your message here... You can include links to screenshots. For deposit issues, please include wallet address."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-[#C75D2C] focus:ring-opacity-20 focus:border-[#C75D2C] transition-all duration-200"
                  rows="3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(submitMessage)();
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
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
              <span>Auto-refresh every second</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Messages;