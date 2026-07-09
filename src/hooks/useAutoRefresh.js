import { useEffect, useRef, useCallback } from 'react';
import useAuth from './useAuth';
import useRefreshToken from './useRefreshToken';

const useAutoRefresh = (refreshIntervalMinutes = 14) => {
  const { auth } = useAuth();
  const refresh = useRefreshToken();
  const intervalRef = useRef(null);

  const REFRESH_INTERVAL = refreshIntervalMinutes * 60 * 1000; // Convert to milliseconds

  const handleRefresh = useCallback(async () => {
    try {
      // Only refresh if user is still authenticated
      if (auth?.accessToken) {
        // console.log('Auto-refreshing token...');
        await refresh();
        // console.log('Token refreshed successfully');
      }
    } catch (error) {
      // console.error('Auto-refresh failed:', error);
      // Don't show error toast for auto-refresh failures as useRefreshToken handles it
    }
  }, [auth?.accessToken, refresh]);

  useEffect(() => {
    // Only set up auto-refresh if user is authenticated
    if (!auth?.accessToken) {
      // Clear any existing interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up auto-refresh interval
    intervalRef.current = setInterval(handleRefresh, REFRESH_INTERVAL);

    // console.log(`Auto-refresh scheduled every ${refreshIntervalMinutes} minutes`);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [auth?.accessToken, handleRefresh, REFRESH_INTERVAL, refreshIntervalMinutes]);

  // Handle page visibility change - pause/resume auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, clear interval to save resources
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (auth?.accessToken) {
        // Page is visible again, restart interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(handleRefresh, REFRESH_INTERVAL);
        
        // Also do an immediate refresh when tab becomes active
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth?.accessToken, handleRefresh, REFRESH_INTERVAL]);

  return null; // This hook doesn't return anything, it just manages auto-refresh
};

export default useAutoRefresh;