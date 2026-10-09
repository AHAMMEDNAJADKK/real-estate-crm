import apiClient from './api/apiClient';

export const leadService = {
  getLeads: (params) => apiClient.get('/leads', { params }),
  getLeadById: (id) => apiClient.get(`/leads/${id}`),
  createLead: (data) => apiClient.post('/leads', data),
  updateLead: (id, data) => apiClient.patch(`/leads/${id}`, data),
  assignLead: (id, assignedTo) => apiClient.patch(`/leads/${id}/assignment`, { assignedTo }),
  updateStatus: (id, data) => apiClient.patch(`/leads/${id}/status`, data),
  getLeadHistory: (id) => apiClient.get(`/leads/${id}/history`),
  importLeads: (leads) => apiClient.post('/leads/import', { leads }),
  exportLeads: (params) => apiClient.get('/leads/export', { params })
};
