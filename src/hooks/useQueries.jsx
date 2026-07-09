import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi } from '../services/api';

// Dashboard hooks
export const useDashboardOverview = (params, options = {}) => {
  const { dashboard } = useApi();

  return useQuery({
    queryKey: ['dashboard', 'overview', params],
    queryFn: () => dashboard.getOverview(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useQuickStats = (params, options = {}) => {
  const { dashboard } = useApi();

  return useQuery({
    queryKey: ['dashboard', 'quick-stats', params],
    queryFn: () => dashboard.getQuickStats(params),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    ...options,
  });
};

export const useRecentActivities = (params, options = {}) => {
  const { dashboard } = useApi();

  return useQuery({
    queryKey: ['dashboard', 'recent-activities', params],
    queryFn: () => dashboard.getRecentActivities(params),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

// Reports hooks
export const useRevenueReport = (params, options = {}) => {
  const { reports } = useApi();

  return useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => reports.getRevenue(params),
    staleTime: 10 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const useOccupancyReport = (params, options = {}) => {
  const { reports } = useApi();

  return useQuery({
    queryKey: ['reports', 'occupancy', params],
    queryFn: () => reports.getOccupancy(params),
    staleTime: 15 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const useCustomerReport = (params, options = {}) => {
  const { reports } = useApi();

  return useQuery({
    queryKey: ['reports', 'customers', params],
    queryFn: () => reports.getCustomers(params),
    staleTime: 30 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const usePropertyReport = (params, options = {}) => {
  const { reports } = useApi();

  return useQuery({
    queryKey: ['reports', 'properties', params],
    queryFn: () => reports.getProperties(params),
    staleTime: 15 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const useFinancialReport = (params, options = {}) => {
  const { reports } = useApi();

  return useQuery({
    queryKey: ['reports', 'financial', params],
    queryFn: () => reports.getFinancial(params),
    staleTime: 10 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const useReviewsReport = (params, options = {}) => {
  const { reports } = useApi();

  return useQuery({
    queryKey: ['reports', 'reviews', params],
    queryFn: () => reports.getReviews(params),
    staleTime: 20 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

// Analytics hooks
export const useRevenueTrends = (params, options = {}) => {
  const { analytics } = useApi();

  return useQuery({
    queryKey: ['analytics', 'revenue-trends', params],
    queryFn: () => analytics.getRevenueTrends(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const useBookingPatterns = (params, options = {}) => {
  const { analytics } = useApi();

  return useQuery({
    queryKey: ['analytics', 'booking-patterns', params],
    queryFn: () => analytics.getBookingPatterns(params),
    staleTime: 10 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const usePerformanceMetrics = (params, options = {}) => {
  const { analytics } = useApi();

  return useQuery({
    queryKey: ['analytics', 'performance-metrics', params],
    queryFn: () => analytics.getPerformanceMetrics(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params,
    refetchInterval: 10 * 60 * 1000,
    ...options,
  });
};

export const useHeatMapData = (params, options = {}) => {
  const { analytics } = useApi();

  return useQuery({
    queryKey: ['analytics', 'heatmap', params],
    queryFn: () => analytics.getHeatMap(params),
    staleTime: 30 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

export const useComparativeAnalysis = (params, options = {}) => {
  const { analytics } = useApi();

  return useQuery({
    queryKey: ['analytics', 'comparative-analysis', params],
    queryFn: () => analytics.getComparativeAnalysis(params),
    staleTime: 60 * 60 * 1000,
    enabled: !!params,
    ...options,
  });
};

// Custom hook for date range management
export const useDateRange = (defaultDays = 30) => {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date(end.getTime() - defaultDays * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  });

  const updateDateRange = (start, end) => {
    setDateRange({
      startDate: start,
      endDate: end,
    });
  };

  const getLastNDays = (days) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    updateDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  return {
    dateRange,
    updateDateRange,
    getLastNDays,
  };
};
