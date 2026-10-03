import api from './api';
import { API_BASE_URL } from '../utils/constants';

const scrapingService = {
  /**
   * Create a new scraping campaign
   */
  createCampaign: async (data) => {
    const response = await api.post('/scraping/campaigns', data);
    return response.data;
  },

  /**
   * List all scraping campaigns
   */
  getCampaigns: async () => {
    const response = await api.get('/scraping/campaigns');
    return response.data;
  },

  /**
   * Get single campaign by ID with target items
   */
  getCampaign: async (id, params = {}) => {
    const response = await api.get(`/scraping/campaigns/${id}`, { params });
    return response.data;
  },

  /**
   * Add places with websites to a campaign
   */
  addPlacesToCampaign: async (campaignId, placeIds) => {
    const response = await api.post(`/scraping/campaigns/${campaignId}/add-places`, {
      placeIds,
    });
    return response.data;
  },

  /**
   * Start scraping execution
   */
  startCampaign: async (id) => {
    const response = await api.post(`/scraping/campaigns/${id}/start`);
    return response.data;
  },

  /**
   * Pause active scraping execution
   */
  pauseCampaign: async (id) => {
    const response = await api.post(`/scraping/campaigns/${id}/pause`);
    return response.data;
  },

  /**
   * Resume paused scraping execution
   */
  resumeCampaign: async (id) => {
    const response = await api.post(`/scraping/campaigns/${id}/resume`);
    return response.data;
  },

  /**
   * Delete campaign and its targets
   */
  deleteCampaign: async (id) => {
    const response = await api.delete(`/scraping/campaigns/${id}`);
    return response.data;
  },

  /**
   * Poll live progress
   */
  getCampaignProgress: async (id) => {
    const response = await api.get(`/scraping/campaigns/${id}/progress`);
    return response.data;
  },

  /**
   * Subscribe to live progress via Server-Sent Events (SSE)
   * Falls back to polling if SSE encounters issues
   */
  subscribeToProgress: (id, onUpdate, onError) => {
    let eventSource = null;
    let pollInterval = null;
    let isClosed = false;

    const startPolling = () => {
      if (pollInterval || isClosed) return;
      pollInterval = setInterval(async () => {
        try {
          const data = await scrapingService.getCampaignProgress(id);
          if (data.success && onUpdate) {
            onUpdate({
              type: 'progress',
              status: data.campaign?.status,
              stats: data.campaign?.stats,
              progressPercent: data.progressPercent,
              isRunning: data.isRunning,
              recentActivity: data.recentActivity,
            });
          }
        } catch (err) {
          if (onError) onError(err);
        }
      }, 2500);
    };

    try {
      const token = localStorage.getItem('token');
      // Pass token in query if needed for EventSource authorization or use cookie
      const streamUrl = `${API_BASE_URL}/scraping/campaigns/${id}/stream${
        token ? `?auth_token=${encodeURIComponent(token)}` : ''
      }`;

      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (onUpdate) onUpdate(payload);
        } catch {
          // ignore non-json
        }
      };

      eventSource.onerror = (err) => {
        // Fallback to polling if SSE closes or fails
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startPolling();
        if (onError) onError(err);
      };
    } catch {
      startPolling();
    }

    // Return cleanup unsubscribe function
    return () => {
      isClosed = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  },
};

export default scrapingService;
