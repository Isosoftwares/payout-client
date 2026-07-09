import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose, MdDashboard } from "react-icons/md";
import useAuth from "../hooks/useAuth";

function NavBar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  // Mock auth state for demo
  const { auth } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.pageYOffset > 20;
      setScrolled(isScrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenu(false);
  }, [location]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Rentals", path: "/rent" },
    { name: "Properties for Sale", path: "/properties" },
    { name: "Holiday Stays", path: "/bnbs" },
    { name: "Contact", path: "/contact" },
  ];

  const NavLink = ({ to, children, className, onClick }) => {
    const isActive = currentPath === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`${className} ${isActive ? "active" : ""} mx-1 `}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className={`transition-all duration-500 ease-out ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-primary/10"
            : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-3"
                  style={{
                    background:
                      "linear-gradient(135deg, #3264ff 0%, #2563eb 100%)",
                  }}
                >
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full opacity-20"
                  style={{ backgroundColor: "#3264ff" }}
                ></div>
              </div>
              <div className="ml-3 hidden sm:block">
                <span
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{
                    background:
                      "linear-gradient(135deg, #3264ff 0%, #2563eb 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  febwin
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <div
                className="flex items-center rounded-2xl p-1 backdrop-blur-sm border"
                style={{
                  backgroundColor: "rgba(245, 245, 245, 0.5)",
                  borderColor: "rgba(50, 100, 255, 0.05)",
                }}
              >
                {navItems.map((item, index) => {
                  const isActive = currentPath === item.path;
                  return (
                    <NavLink
                      key={index}
                      to={item.path}
                      className={`relative px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 group nav-link ${
                        isActive ? "active" : ""
                      }`}
                    >
                      <span
                        className={`relative z-10 transition-colors duration-300 ${
                          isActive
                            ? "font-semibold"
                            : "group-hover:text-primary"
                        }`}
                        style={{
                          color: isActive ? "#3264ff" : "rgba(52, 58, 64, 0.8)",
                        }}
                      >
                        {item.name}
                      </span>
                      <div
                        className={`absolute inset-0 bg-white rounded-xl transition-all duration-300 ${
                          isActive
                            ? "opacity-100 scale-100 ring-1"
                            : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                        }`}
                        style={{
                          ringColor: isActive
                            ? "rgba(50, 100, 255, 0.2)"
                            : "transparent",
                        }}
                      ></div>
                      {/* Active indicator dot */}
                      {isActive && (
                        <div
                          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#3264ff" }}
                        ></div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              {!auth?.userId ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-6 py-2.5 font-medium transition-all duration-300 relative group"
                    style={{ color: "rgba(52, 58, 64, 0.7)" }}
                    onMouseEnter={(e) => (e.target.style.color = "#3264ff")}
                    onMouseLeave={(e) =>
                      (e.target.style.color = "rgba(52, 58, 64, 0.7)")
                    }
                  >
                    <span className="relative z-10">Login</span>
                    <div
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"
                      style={{ backgroundColor: "rgba(50, 100, 255, 0.05)" }}
                    ></div>
                  </Link>
                  <Link
                    to="/signup"
                    className="group relative overflow-hidden text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    style={{ backgroundColor: "#3264ff" }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#2563eb")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#3264ff")
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Get Started</span>
                  </Link>
                </div>
              ) : auth?.roles?.includes("Admin") ? (
                <Link
                  to="/dashboard"
                  className=" py-2 px-3 text-white font-semibold rounded-xl transition-all duration-300"
                  style={{ backgroundColor: "#3264ff" }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#2563eb")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#3264ff")
                  }
                >
                  <span>Dashboard</span>
                </Link>
              ) : (
                <div>
                  <Link
                    to="/client"
                    className="block w-full text-center py-2 px-4 text-white font-semibold rounded-xl transition-all duration-300"
                    style={{ backgroundColor: "#3264ff" }}
                  >
                    My Bookings
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden relative w-10 h-10 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: "rgba(245, 245, 245, 0.8)",
                borderColor: "rgba(50, 100, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(50, 100, 255, 0.1)";
                e.target.style.borderColor = "rgba(50, 100, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(245, 245, 245, 0.8)";
                e.target.style.borderColor = "rgba(50, 100, 255, 0.1)";
              }}
            >
              <div className="relative w-6 h-6">
                <div
                  className={`absolute top-1/2 left-1/2 w-5 h-0.5 transition-all duration-300 ${
                    mobileMenu
                      ? "rotate-45 translate-x-[-50%] translate-y-[-50%]"
                      : "rotate-0 translate-x-[-50%] translate-y-[-8px]"
                  }`}
                  style={{ backgroundColor: "#3264ff" }}
                ></div>
                <div
                  className={`absolute top-1/2 left-1/2 w-5 h-0.5 transition-all duration-300 ${
                    mobileMenu
                      ? "opacity-0 translate-x-[-50%] translate-y-[-50%]"
                      : "opacity-100 translate-x-[-50%] translate-y-[-50%]"
                  }`}
                  style={{ backgroundColor: "#3264ff" }}
                ></div>
                <div
                  className={`absolute top-1/2 left-1/2 w-5 h-0.5 transition-all duration-300 ${
                    mobileMenu
                      ? "-rotate-45 translate-x-[-50%] translate-y-[-50%]"
                      : "rotate-0 translate-x-[-50%] translate-y-[6px]"
                  }`}
                  style={{ backgroundColor: "#3264ff" }}
                ></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 ${
          mobileMenu ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{ backgroundColor: "rgba(52, 58, 64, 0.2)" }}
        onClick={() => setMobileMenu(false)}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] backdrop-blur-xl border-l z-50 xl:hidden transform transition-all duration-500 ease-out ${
          mobileMenu ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "rgba(50, 100, 255, 0.1)",
        }}
      >
        {/* Mobile Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "rgba(50, 100, 255, 0.1)" }}
        >
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3264ff 0%, #2563eb 100%)",
              }}
            >
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span
              className="ml-3 text-xl font-bold"
              style={{ color: "#3264ff" }}
            >
              febwin
            </span>
          </div>
          <button
            onClick={() => setMobileMenu(false)}
            className="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors duration-300"
            style={{
              backgroundColor: "rgba(245, 245, 245, 0.8)",
              borderColor: "rgba(50, 100, 255, 0.1)",
            }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "rgba(50, 100, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "rgba(245, 245, 245, 0.8)")
            }
          >
            <MdClose size={20} style={{ color: "#3264ff" }} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="p-6">
          <div className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = currentPath === item.path;
              return (
                <NavLink
                  key={index}
                  to={item.path}
                  className={`relative block px-4 py-4 font-medium rounded-xl transition-all duration-300 border ${
                    isActive
                      ? "translate-x-2"
                      : "border-transparent hover:translate-x-1"
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? "rgba(50, 100, 255, 0.1)"
                      : "transparent",
                    color: isActive ? "#3264ff" : "rgba(52, 58, 64, 0.8)",
                    borderColor: isActive
                      ? "rgba(50, 100, 255, 0.2)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor =
                        "rgba(50, 100, 255, 0.05)";
                      e.target.style.color = "#3264ff";
                      e.target.style.borderColor = "rgba(50, 100, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "rgba(52, 58, 64, 0.8)";
                      e.target.style.borderColor = "transparent";
                    }
                  }}
                >
                  {/* Active indicator line */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full"
                      style={{ backgroundColor: "#3264ff" }}
                    ></div>
                  )}
                  <span className="relative z-10">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Mobile Auth Section */}
        <div
          className="absolute bottom-0 left-0 right-0 p-6 border-t"
          style={{
            borderColor: "rgba(50, 100, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
          }}
        >
          {!auth?.userId ? (
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full text-center py-4 font-medium border rounded-xl transition-all duration-300"
                style={{
                  color: "rgba(52, 58, 64, 0.7)",
                  borderColor: "rgba(50, 100, 255, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "rgba(50, 100, 255, 0.05)";
                  e.target.style.color = "#3264ff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "rgba(52, 58, 64, 0.7)";
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block w-full text-center py-4 text-white font-semibold rounded-xl transition-all duration-300"
                style={{ backgroundColor: "#3264ff" }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#2563eb")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#3264ff")
                }
              >
                Get Started
              </Link>
            </div>
          ) : auth?.roles?.includes("Admin") ? (
            <Link
              to="/dashboard"
              className="flex items-center justify-center space-x-2 w-full py-4 text-white font-semibold rounded-xl transition-all duration-300"
              style={{ backgroundColor: "#3264ff" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#3264ff")}
            >
              <MdDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <div>
              <Link
                to="/client"
                className="block w-full text-center py-4 text-white font-semibold rounded-xl transition-all duration-300"
                style={{ backgroundColor: "#3264ff" }}
              >
                My Bookings
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NavBar;
