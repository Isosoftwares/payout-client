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
import { BiSupport } from "react-icons/bi";
import { TbBell } from "react-icons/tb";


const Header = ({ setSideNav, sideNav }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axios = useAxiosPrivate();

  const logOut = useLogout();
  const signOut = async () => {
    await logOut();
    navigate("/");
  };

  const toggleSidebar = () => {
    setSideNav(!sideNav);
  };

  const fetchSupportCount = () => {
    return axios.get(`/support/admin-unread`);
  };

  const { isLoading: loadingSupports, data: supportData } = useQuery({
    queryKey: [`supportcount-`],
    queryFn: fetchSupportCount,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
    staleTime: 5000, // data can remain stale for 5 seconds
    refetchInterval: 5000, // refetch every 5 seconds
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => axios.get('/notifications/admin-pending'),
    refetchInterval: 10000,
  });

  const pendingCount = notificationsData?.data?.data?.pendingBankDetails || 0;

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

            <div className="flex items-center space-x-3">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
                Welcome,{" "}
                <span className="hidden sm:inline text-primary-600">
                  {auth?.user?.email?.split("@")[0]}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-row gap-2 items-center justify-center">
            <div className="pt-2" title="Support">
              <Link to={"/dashboard/supports"}>
                {supportData?.data?.totalAdminUnread > 0 ? (
                  <Indicator
                    inline
                    label={supportData?.data?.totalAdminUnread}
                    size={16}
                    color="red"
                  >
                    <BiSupport size={23} />
                  </Indicator>
                ) : (
                  <BiSupport size={23} />
                )}
              </Link>
            </div>

            {/* Notification Menu */}
            <Menu as="div" className="relative pr-5 pt-1.5">
              <Menu.Button className="focus:outline-none flex items-center">
                {pendingCount > 0 ? (
                  <Indicator inline label={pendingCount} size={16} color="red">
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
                  <div className="px-4 py-4 text-sm text-gray-600">
                    You have <span className="font-bold text-red-600">{pendingCount}</span> Payout Names waiting for Bank Details.
                    <div className="mt-3">
                      <Link to="/dashboard/payout-names" state={{ filter: 'pending_bank_details' }} className="text-primary hover:underline">Manage Payout Names</Link>
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* User Menu */}
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
