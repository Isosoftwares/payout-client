import { useEffect, useRef, useCallback } from 'react';
import useAuth from './useAuth';
import useLogout from './useLogout';
import { toast } from 'react-toastify';

const useActivityTracker = (timeoutMinutes = 15) => {
  const { auth } = useAuth();
  const logout = useLogout();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const isActiveRef = useRef(true);

  const TIMEOUT_DURATION = timeoutMinutes * 60 * 1000; // Convert to milliseconds
  const WARNING_DURATION = (timeoutMinutes - 2) * 60 * 1000; // Warn 2 minutes before logout

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Only set timers if user is authenticated
    if (!auth?.accessToken) return;

    // Set warning timer (2 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        toast.warning(
          `You will be logged out in 2 minutes due to inactivity. Move your mouse or click to stay logged in.`,
          {
            autoClose: 10000,
            closeOnClick: true,
          }
        );
      }
    }, WARNING_DURATION);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        toast.info('You have been logged out due to inactivity.');
        logout();
      }
    }, TIMEOUT_DURATION);
  }, [auth?.accessToken, logout, TIMEOUT_DURATION, WARNING_DURATION]);

  const handleActivity = useCallback(() => {
    if (auth?.accessToken) {
      resetTimer();
    }
  }, [auth?.accessToken, resetTimer]);

  const handleVisibilityChange = useCallback(() => {
    isActiveRef.current = !document.hidden;
    
    if (!document.hidden && auth?.accessToken) {
      // Tab became active, reset timer
      resetTimer();
    } else if (document.hidden) {
      // Tab became inactive, clear timers to prevent logout when not visible
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }
  }, [auth?.accessToken, resetTimer]);

  useEffect(() => {
    // Only track activity if user is authenticated
    if (!auth?.accessToken) {
      // Clear any existing timers if user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [auth?.accessToken, handleActivity, handleVisibilityChange, resetTimer]);

  return null; // This hook doesn't return anything, it just manages the activity tracking
};

export default useActivityTracker;