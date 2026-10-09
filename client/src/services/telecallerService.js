import apiClient from './api/apiClient';

export const telecallerService = {
  getCallLogs: (params) => apiClient.get('/call-logs', { params }),
  recordCallLog: (data) => apiClient.post('/call-logs', data),
  getFollowUps: (params) => apiClient.get('/follow-ups', { params }),
  createFollowUp: (data) => apiClient.post('/follow-ups', data),
  updateFollowUp: (id, data) => apiClient.patch(`/follow-ups/${id}`, data),
  getCallingQueue: () => apiClient.get('/telecallers/queue')
};
