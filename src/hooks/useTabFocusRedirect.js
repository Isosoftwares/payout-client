import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from './useAuth';

const useTabFocusRedirect = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = useCallback((authData) => {
    if (!authData?.userId || !authData?.roles) return null;
    
    if (authData.roles.includes("admin") || authData.roles.includes("Admin")) {
      return "/dashboard";
    }
    if (authData.roles.includes("client") || authData.roles.includes("Client")) {
      return "/client";
    }
    
    return null;
  }, []);

  const shouldRedirect = useCallback((currentPath, targetPath) => {
    if (!targetPath) return false;
    
    // Don't redirect if already on the correct path or a subpath
    if (currentPath.startsWith(targetPath)) return false;
    
    // Don't redirect if on login/signup pages
    if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/') return false;
    
    return true;
  }, []);

  const handleTabFocus = useCallback(() => {
    if (!auth?.accessToken) return;

    const targetPath = getRedirectPath(auth);
    const currentPath = location.pathname;

    if (targetPath && shouldRedirect(currentPath, targetPath)) {
      // console.log(`Redirecting from ${currentPath} to ${targetPath} due to tab focus`);
      navigate(targetPath, { replace: true });
    }
  }, [auth, location.pathname, navigate, getRedirectPath, shouldRedirect]);

  const handleWindowFocus = useCallback(() => {
    // Small delay to ensure auth state is stable
    setTimeout(handleTabFocus, 100);
  }, [handleTabFocus]);

  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      // Tab became visible
      handleTabFocus();
    }
  }, [handleTabFocus]);

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!auth?.accessToken) return;

    // Listen for window focus events
    window.addEventListener('focus', handleWindowFocus);
    
    // Listen for visibility change events (more reliable than focus in some cases)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check immediately when the hook is set up
    if (!document.hidden) {
      handleTabFocus();
    }

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth?.accessToken, handleWindowFocus, handleVisibilityChange, handleTabFocus]);

  return null; // This hook doesn't return anything, it just manages redirection
};

export default useTabFocusRedirect;