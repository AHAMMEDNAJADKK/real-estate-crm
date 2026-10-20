import apiClient from './api/apiClient';

export const followUpService = {
  getFollowUps: (params) => apiClient.get('/follow-ups', { params }),
  getFollowUpById: (id) => apiClient.get(`/follow-ups/${id}`),
  createFollowUp: (data) => apiClient.post('/follow-ups', data),
  updateFollowUp: (id, data) => apiClient.patch(`/follow-ups/${id}`, data),
  completeFollowUp: (id, data) => apiClient.patch(`/follow-ups/${id}`, { ...data, status: 'Completed' }),
  rescheduleFollowUp: (id, data) => apiClient.patch(`/follow-ups/${id}`, { ...data, status: 'Rescheduled' }),
  cancelFollowUp: (id, data) => apiClient.patch(`/follow-ups/${id}`, { ...data, status: 'Cancelled' }),
  deleteFollowUp: (id) => apiClient.delete(`/follow-ups/${id}`)
};

export default followUpService;
