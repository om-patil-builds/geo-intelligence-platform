import api from './api';

const authService = {
  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Register new user
   * @param {string} name 
   * @param {string} email 
   * @param {string} password 
   */
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
};

export default authService;
