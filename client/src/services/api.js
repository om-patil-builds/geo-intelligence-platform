import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Using proxy in Vite or relative path
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (name, email, password) => {
    // For demo/stub purposes, simulate an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            token: 'fake-jwt-token',
            user: { id: 1, name, email }
          }
        });
      }, 1000);
    });
    // return api.post('/auth/register', { name, email, password });
  },
  login: async (email, password) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'test@example.com' && password === 'password') {
          resolve({
            data: {
              token: 'fake-jwt-token',
              user: { id: 1, name: 'Test User', email }
            }
          });
        } else {
          // just accept anything for the hackathon UI demo
          resolve({
            data: {
              token: 'fake-jwt-token',
              user: { id: 1, name: email.split('@')[0], email }
            }
          });
        }
      }, 1000);
    });
    // return api.post('/auth/login', { email, password });
  },
  me: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            user: { id: 1, name: 'Current User', email: 'user@example.com' }
          }
        });
      }, 500);
    });
    // return api.get('/auth/me');
  }
};

export default api;
