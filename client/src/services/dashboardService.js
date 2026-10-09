import apiClient from './api/apiClient';

export const dashboardService = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getPipeline: () => apiClient.get('/dashboard/pipeline'),
  getPerformance: () => apiClient.get('/dashboard/performance')
};

export const employeeService = {
  getUsers: (params) => apiClient.get('/users', { params }),
  createUser: (data) => apiClient.post('/users', data),
  updateUser: (id, data) => apiClient.patch(`/users/${id}`, data),
  getUserWorkload: (id) => apiClient.get(`/users/${id}/workload`)
};

export const commissionService = {
  getCommissions: (params) => apiClient.get('/commissions', { params }),
  approveCommission: (id) => apiClient.patch(`/commissions/${id}/approve`),
  payoutCommission: (id, data) => apiClient.patch(`/commissions/${id}/pay`, data)
};

export const accountService = {
  getTransactions: (params) => apiClient.get('/accounts/transactions', { params }),
  createTransaction: (data) => apiClient.post('/accounts/transactions', data),
  getReconciliation: () => apiClient.get('/accounts/reconciliation')
};

export const reportService = {
  getReport: (reportType, params) => apiClient.get(`/reports/${reportType}`, { params })
};

export const notificationService = {
  getNotifications: () => apiClient.get('/notifications'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post('/notifications/mark-all-read')
};

export const settingService = {
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (data) => apiClient.patch('/settings', data),
  getAuditLogs: (params) => apiClient.get('/settings/audit-logs', { params }),
  uploadFile: (formData) => apiClient.post('/settings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};
