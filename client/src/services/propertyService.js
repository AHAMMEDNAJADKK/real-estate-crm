import apiClient from './api/apiClient';

export const projectService = {
  getProjects: (params) => apiClient.get('/projects', { params }),
  getProjectById: (id) => apiClient.get(`/projects/${id}`),
  createProject: (data) => apiClient.post('/projects', data),
  updateProject: (id, data) => apiClient.patch(`/projects/${id}`, data)
};

export const propertyService = {
  getProperties: (params) => apiClient.get('/properties', { params }),
  getPropertyById: (id) => apiClient.get(`/properties/${id}`),
  createProperty: (data) => apiClient.post('/properties', data),
  updateProperty: (id, data) => apiClient.patch(`/properties/${id}`, data)
};
