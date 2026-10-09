import apiClient from './api/apiClient';

export const authService = {
  login: async (email, password) => {
    return apiClient.post('/auth/login', { email, password });
  },
  getMe: async () => {
    return apiClient.get('/auth/me');
  },
  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return apiClient.post('/auth/logout').catch(() => {});
  }
};
