import { useState, useCallback } from 'react';
import placeService from '../services/placeService';

export const usePlaces = () => {
  const [places, setPlaces] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchStats, setSearchStats] = useState({
    totalPlaces: 0,
    avgRating: 0,
    duplicateCount: 0,
    newCount: 0,
    apiCalls: 0
  });

  const search = useCallback(async (keyword, location, radius, maxResults) => {
    setLoading(true);
    setError(null);
    try {
      const result = await placeService.search(keyword, location, radius, maxResults);
      if (result.success) {
        setPlaces(result.data || []);
        
        // Calculate dynamic average rating
        const data = result.data || [];
        const rated = data.filter(p => typeof p.rating === 'number' && p.rating > 0);
        const avg = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;

        setSearchStats({
          totalPlaces: data.length,
          avgRating: parseFloat(avg.toFixed(2)),
          duplicateCount: result.duplicateCount || 0,
          newCount: result.newCount || 0,
          apiCalls: result.apiCalls || 0
        });
        return { success: true, data: result.data };
      } else {
        setError(result.message || 'Search failed');
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error occurred during search';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlaces = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await placeService.getPlaces(filters);
      if (result.success) {
        setPlaces(result.data || []);
        
        // Calculate average rating across retrieved places
        const data = result.data || [];
        const rated = data.filter(p => typeof p.rating === 'number' && p.rating > 0);
        const avg = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;

        setSearchStats(prev => ({
          ...prev,
          totalPlaces: result.total || data.length,
          avgRating: parseFloat(avg.toFixed(2))
        }));
        return { success: true, data: result.data, pagination: { total: result.total, pages: result.pages } };
      } else {
        setError(result.message || 'Failed to fetch places');
        return { success: false };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error fetching places';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlace = useCallback(async (id) => {
    try {
      const result = await placeService.deletePlace(id);
      if (result.success) {
        // Remove from current list
        setPlaces(prev => {
          const updated = prev.filter(p => p._id !== id);
          
          // Re-calculate average rating for local state
          const rated = updated.filter(p => typeof p.rating === 'number' && p.rating > 0);
          const avg = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;

          setSearchStats(prevStats => ({
            ...prevStats,
            totalPlaces: updated.length,
            avgRating: parseFloat(avg.toFixed(2))
          }));

          return updated;
        });
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete place';
      return { success: false, message: msg };
    }
  }, []);

  const fetchHistory = useCallback(async (limit = 25) => {
    setLoading(true);
    setError(null);
    try {
      const result = await placeService.getHistory(limit);
      if (result.success) {
        setHistory(result.data || []);
        return { success: true, data: result.data };
      } else {
        setError(result.message || 'Failed to fetch history');
        return { success: false };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error fetching history';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    places,
    history,
    loading,
    error,
    searchStats,
    search,
    fetchPlaces,
    deletePlace,
    fetchHistory,
    setPlaces,
    setError
  };
};
export default usePlaces;
