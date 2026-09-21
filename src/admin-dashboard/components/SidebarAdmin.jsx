import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import {
  HomeIcon,
  DocumentPlusIcon,
  ClockIcon,
  UsersIcon,
  UserIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard Overview", href: "/dashboard/overview", icon: HomeIcon },
  { name: "Manage Clients", href: "/dashboard/clients", icon: UsersIcon },
  { name: "Payout Names", href: "/dashboard/payout-names", icon: DocumentPlusIcon, key: "payout-names" },
  { name: "Allocation Requests", href: "/dashboard/allocation-requests", icon: DocumentPlusIcon, key: "allocation-requests" },
  { name: "Payments", href: "/dashboard/payments", icon: SparklesIcon },
  { name: "Process Payouts", href: "/dashboard/process-payouts", icon: SparklesIcon },
  { name: "Fee Ledger", href: "/dashboard/fee-ledger", icon: SparklesIcon },
  { name: "Profile", href: "/dashboard/profile", icon: UserIcon },
  { name: "Support", href: "/dashboard/supports", icon: UserIcon },
];

const SidebarAdmin = ({ setSideNav, sideNav }) => {
  const location = useLocation();
  const axios = useAxiosPrivate();

  const { data: accountsData } = useQuery({
    queryKey: ["virtual-accounts"],
    queryFn: () => axios.get("/virtual-accounts"),
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

 

  const { data: allocationRequestsData } = useQuery({
    queryKey: ["admin-allocation-requests-polling"],
    queryFn: () => axios.get("/payout-names/requests?status=pending"),
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: specificRequestsData } = useQuery({
    queryKey: ["admin-specific-requests-polling"],
    queryFn: () => axios.get("/payout-names/specific-requests?status=pending&limit=1"),
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const unattendedPayoutNames = accountsData?.data?.data?.data?.filter(
    (acc) => acc.status === "pending_bank_details" || acc.status === "pending"
  ).length || 0;



  const unattendedBulk = allocationRequestsData?.data?.total || 0;
  const unattendedSpecific = specificRequestsData?.data?.total || 0;
  const unattendedAllocationRequests = unattendedBulk + unattendedSpecific;

  const closeSidebar = () => {
    setSideNav(false);
  };

  const date = new Date();
  const year = date.getFullYear();

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {sideNav && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity lg:hidden z-20"
          onClick={closeSidebar}
        />
      )}

      {/* SidebarAdmin */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out shadow-strong border-r border-neutral-800
          lg:relative lg:translate-x-0 lg:z-auto
          ${sideNav ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-700">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <SparklesIcon className="h-8 w-8 text-primary-400" />
                <h1 className="text-2xl font-bold text-white">Payout System</h1>
              </div>
              <p className="text-neutral-400 text-sm font-medium">
                Admin Dashboard
              </p>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-primary transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 1024) {
                      closeSidebar();
                    }
                  }}
                  className={`
                    flex items-center space-x-3 py-3.5 px-4 rounded-xl transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-primary text-white shadow-medium font-semibold"
                        : "text-neutral-300 hover:bg-primary hover:text-white hover:translate-x-1"
                    }
                  `}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate font-medium flex-1">{item.name}</span>

                  {/* Badges for unattended items */}
                  {item.key === "payout-names" && unattendedPayoutNames > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm mr-2 z-10">
                      {unattendedPayoutNames}
                    </span>
                  )}
                  {item.key === "allocation-requests" && unattendedAllocationRequests > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm mr-2 z-10">
                      {unattendedAllocationRequests}
                    </span>
                  )}
                 

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-4 w-2 h-2 bg-primary rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-700">
            <div className="text-xs text-neutral-400 text-center">
              © {year} payout system. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarAdmin;
