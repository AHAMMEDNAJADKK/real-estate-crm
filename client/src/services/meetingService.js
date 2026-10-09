import apiClient from './api/apiClient';

export const meetingService = {
  getMeetings: (params) => apiClient.get('/meetings', { params }),
  createMeeting: (data) => apiClient.post('/meetings', data),
  updateMeeting: (id, data) => apiClient.patch(`/meetings/${id}`, data)
};

export const siteVisitService = {
  getSiteVisits: (params) => apiClient.get('/site-visits', { params }),
  createSiteVisit: (data) => apiClient.post('/site-visits', data),
  updateSiteVisit: (id, data) => apiClient.patch(`/site-visits/${id}`, data)
};
