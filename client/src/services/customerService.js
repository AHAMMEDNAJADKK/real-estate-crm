import apiClient from './api/apiClient';

export const customerService = {
  getCustomers: (params) => apiClient.get('/customers', { params }),
  createCustomer: (data) => apiClient.post('/customers', data),
  getCustomer360: (id) => apiClient.get(`/customers/${id}`),
  updateCustomer: (id, data) => apiClient.patch(`/customers/${id}`, data)
};

export const opportunityService = {
  getOpportunities: (params) => apiClient.get('/opportunities', { params }),
  createOpportunity: (data) => apiClient.post('/opportunities', data),
  getOpportunityById: (id) => apiClient.get(`/opportunities/${id}`),
  updateOpportunity: (id, data) => apiClient.patch(`/opportunities/${id}`, data)
};
