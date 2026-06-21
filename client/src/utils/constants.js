const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // Append /api if not already present
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();

export const DEFAULT_RADIUS = 10000; // in meters (10km)
export const DEFAULT_MAX_RESULTS = 40;

export const LEAD_TIER_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
  medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
};
