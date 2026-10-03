import api from './api';
import { API_BASE_URL } from '../utils/constants';

const emailService = {
  /**
   * Create a new email outreach campaign
   */
  createCampaign: async (data) => {
    const response = await api.post('/email/campaigns', data);
    return response.data;
  },

  /**
   * List all email outreach campaigns
   */
  getCampaigns: async () => {
    const response = await api.get('/email/campaigns');
    return response.data;
  },

  /**
   * Get single email campaign by ID with target recipients
   */
  getCampaign: async (id, params = {}) => {
    const response = await api.get(`/email/campaigns/${id}`, { params });
    return response.data;
  },

  /**
   * Update email campaign details (name, category, subject, templateBody, sendDelaySeconds)
   */
  updateCampaign: async (id, data) => {
    const response = await api.put(`/email/campaigns/${id}`, data);
    return response.data;
  },

  /**
   * Delete email campaign and targets
   */
  deleteCampaign: async (id) => {
    const response = await api.delete(`/email/campaigns/${id}`);
    return response.data;
  },

  /**
   * Import scraped leads into this email campaign
   */
  importLeads: async (campaignId, payload) => {
    const response = await api.post(`/email/campaigns/${campaignId}/import-leads`, payload);
    return response.data;
  },

  /**
   * Start email campaign dispatch
   */
  startCampaign: async (id) => {
    const response = await api.post(`/email/campaigns/${id}/start`);
    return response.data;
  },

  /**
   * Pause email campaign dispatch
   */
  pauseCampaign: async (id) => {
    const response = await api.post(`/email/campaigns/${id}/pause`);
    return response.data;
  },

  /**
   * Resume paused email campaign dispatch
   */
  resumeCampaign: async (id) => {
    const response = await api.post(`/email/campaigns/${id}/resume`);
    return response.data;
  },

  /**
   * Poll live email dispatch progress
   */
  getCampaignProgress: async (id) => {
    const response = await api.get(`/email/campaigns/${id}/progress`);
    return response.data;
  },

  /**
   * Subscribe to live progress via Server-Sent Events (SSE) with polling fallback
   */
  subscribeToProgress: (id, onUpdate, onError) => {
    let eventSource = null;
    let pollInterval = null;
    let isClosed = false;

    const startPolling = () => {
      if (pollInterval || isClosed) return;
      pollInterval = setInterval(async () => {
        try {
          const data = await emailService.getCampaignProgress(id);
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
      const streamUrl = `${API_BASE_URL}/email/campaigns/${id}/stream${
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

  /**
   * Get user's Gmail configuration
   */
  getGmailSettings: async () => {
    const response = await api.get('/email/settings/gmail');
    return response.data;
  },

  /**
   * Connect or update user's Gmail account with Google App Password
   */
  updateGmailSettings: async (data) => {
    const response = await api.post('/email/settings/gmail', data);
    return response.data;
  },

  /**
   * Disconnect user's Gmail account
   */
  disconnectGmail: async () => {
    const response = await api.post('/email/settings/disconnect-gmail');
    return response.data;
  },
};

export default emailService;
