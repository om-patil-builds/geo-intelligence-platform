import api from './api';
import { API_BASE_URL } from '../utils/constants';

const placeService = {
  /**
   * Trigger search for places
   */
  search: async (keyword, location, radius, maxResults) => {
    const response = await api.post('/places/search', {
      keyword,
      location,
      radius,
      maxResults
    });
    return response.data;
  },

  /**
   * Get search job status
   */
  getSearchStatus: async (jobId) => {
    const response = await api.get(`/places/status/${jobId}`);
    return response.data;
  },

  /**
   * Get places list with filtering and pagination
   */
  getPlaces: async (filters = {}) => {
    const response = await api.get('/places', { params: filters });
    return response.data;
  },

  /**
   * Delete a place by ID
   */
  deletePlace: async (id) => {
    const response = await api.delete(`/places/${id}`);
    return response.data;
  },

  /**
   * Fetch search history logs
   */
  getHistory: async (limit = 25) => {
    const response = await api.get('/history', { params: { limit } });
    return response.data;
  },

  /**
   * Generate CSV download URL
   */
  getExportCsvUrl: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.location) params.append('location', filters.location);
    if (filters.city) params.append('city', filters.city);
    if (filters.ids) params.append('ids', filters.ids);
    return `${API_BASE_URL}/export/csv?${params.toString()}`;
  },

  /**
   * Generate Excel download URL
   */
  getExportExcelUrl: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.location) params.append('location', filters.location);
    if (filters.city) params.append('city', filters.city);
    if (filters.ids) params.append('ids', filters.ids);
    return `${API_BASE_URL}/export/excel?${params.toString()}`;
  }
};

export default placeService;
