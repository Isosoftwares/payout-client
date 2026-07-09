// ================================
// COMPONENTS/LAYOUT/LAYOUT.JS - Responsive Main Layout
// ================================
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  const [sideNav, setSideNav] = useState(false);

  // Close sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSideNav(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sideNav) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sideNav]);

  const date = new Date();
  const year = date.getFullYear();

  return (
    <div className="flex h-screen bg-neutral-50 relative">
      {/* Sidebar */}
      <Sidebar sideNav={sideNav} setSideNav={setSideNav} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header
          sideNav={sideNav}
          setSideNav={setSideNav}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 py-6 px-4 sm:px-6">
          <div className="">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
