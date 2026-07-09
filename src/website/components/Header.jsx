// ================================
// COMPONENTS/LAYOUT/HEADER.JS - Top Header with Hamburger Menu
// ================================
import React, { useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import useLogout from "../../hooks/useLogout";
import useAuth from "../../hooks/useAuth";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { Indicator } from "@mantine/core";
import { TbMessageCircle, TbBell } from "react-icons/tb";


const Header = ({ setSideNav, sideNav }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const logOut = useLogout();
  const signOut = async () => {
    await logOut();
    navigate("/");
  };

  const toggleSidebar = () => {
    setSideNav(!sideNav);
  };

  //get conversation......................
  function getUnreadMessagesCount() {
    return axiosPrivate.get(`/support/customer-unread/${auth?.userId}`);
  }
  // querying funtion
  const {
    data: conversationData,
  } = useQuery({
    queryKey: [`message-count-${auth?.userId}`],
    queryFn: getUnreadMessagesCount,
    staleTime: 5000, 
    refetchInterval: 5000,
  });

  const isAdmin = auth?.data?.role === 'admin';

  // Notifications
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', auth?.userId],
    queryFn: () => isAdmin 
      ? axiosPrivate.get('/notifications/admin-pending')
      : axiosPrivate.get('/notifications'),
    refetchInterval: 10000,
  });

  const markNotificationsRead = async () => {
    if (!isAdmin && notificationsData?.data?.data?.unreadCount > 0) {
      try {
        await axiosPrivate.put('/notifications/read');
        refetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const notificationCount = isAdmin 
    ? notificationsData?.data?.data?.totalPending || 0 
    : notificationsData?.data?.data?.unreadCount || 0;

  const notificationsList = isAdmin ? [] : (notificationsData?.data?.data?.notifications || []);


  return (
    <header className="bg-white shadow-soft border-b border-neutral-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu Button - Only visible on mobile/tablet */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              {sideNav ? (
                <XMarkIcon className="h-7 w-7" />
              ) : (
                <Bars3Icon className="h-7 w-7" />
              )}
            </button>

            <div className="hidden md:flex items-center space-x-3">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
                Welcome,{" "}
                <span className=" text-primary-600">
                  {auth?.user?.email?.split("@")[0]}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="pr-5" title="Support">
              <Link to={"/client/support"}>
                {conversationData?.data?.totalCustomerUnread > 0 ? (
                  <Indicator
                    inline
                    label={conversationData?.data?.totalCustomerUnread}
                    size={16}
                  >
                    <TbMessageCircle size={25} />
                  </Indicator>
                ) : (
                  <TbMessageCircle size={25} />
                )}
              </Link>
            </div>

            {/* Notification Menu */}
            <Menu as="div" className="relative pr-5">
              <Menu.Button onClick={markNotificationsRead} className="focus:outline-none flex items-center">
                {notificationCount > 0 ? (
                  <Indicator inline label={notificationCount} size={16} color="red">
                    <TbBell size={25} className="text-gray-600" />
                  </Indicator>
                ) : (
                  <TbBell size={25} className="text-gray-600" />
                )}
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-80 rounded-xl shadow-medium bg-white ring-1 ring-neutral-200 focus:outline-none z-50 py-2 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  {isAdmin ? (
                    <div className="px-4 py-4 text-sm text-gray-600">
                      You have <span className="font-bold text-red-600">{notificationsData?.data?.data?.pendingBankDetails || 0}</span> Payout Names waiting for Bank Details.
                      <div className="mt-3">
                        <Link to="/dashboard/payout-names" className="text-primary hover:underline">Manage Payout Names</Link>
                      </div>
                    </div>
                  ) : (
                    notificationsList.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-500 text-center">No notifications yet.</div>
                    ) : (
                      notificationsList.map(notif => (
                        <div key={notif._id} className={`px-4 py-3 border-b border-gray-50 ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 sm:space-x-3 text-sm rounded-lg p-2 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200">
                <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-neutral-500" />
                <span className="hidden md:block text-neutral-700 font-medium">
                  {auth?.data?.username}
                </span>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 rounded-xl shadow-medium bg-white ring-1 ring-neutral-200 focus:outline-none z-50 py-2">
                  <div className="border-t border-neutral-100 my-1" />
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          signOut();
                        }}
                        className={`${
                          active
                            ? "bg-error-50 text-error-700"
                            : "text-neutral-700"
                        } flex items-center w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-200`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
