import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuth = ({ allowedRoles }) => {
  const { auth } = useAuth();
  const location = useLocation();

  const checkUserLoggedIn = (data) => {
    if (!data?.userId) return "/unauthorized";
    
    // Normalize role checking to handle both cases (admin/Admin, client/Client)
    const userRoles = data?.roles?.map(role => role.toLowerCase()) || [];
    
    if (userRoles.includes("admin")) return "/dashboard/overview";
    if (userRoles.includes("client")) return "/client";

    return "/unauthorized";
  };

  // Normalize both user roles and allowed roles for comparison
  const userRoles = auth?.roles?.map(role => role.toLowerCase()) || [];
  const normalizedAllowedRoles = allowedRoles?.map(role => role.toLowerCase()) || [];

  // Check if user has any of the allowed roles
  const hasPermission = userRoles.some(role => normalizedAllowedRoles.includes(role));

  return hasPermission ? (
    <Outlet />
  ) : auth?.accessToken ? (
    // User is authenticated but doesn't have permission, redirect to their appropriate dashboard
    <Navigate to={checkUserLoggedIn(auth)} state={{ from: location }} replace />
  ) : (
    // User is not authenticated, redirect to login
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequireAuth;