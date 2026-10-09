import apiClient from './api/apiClient';

export const bookingService = {
  getBookings: (params) => apiClient.get('/bookings', { params }),
  createReservation: (data) => apiClient.post('/bookings', data),
  getBookingById: (id) => apiClient.get(`/bookings/${id}`),
  confirmBooking: (id) => apiClient.post(`/bookings/${id}/confirm`),
  cancelBooking: (id, reason) => apiClient.post(`/bookings/${id}/cancel`, { reason })
};

export const paymentService = {
  getPayments: (params) => apiClient.get('/payments', { params }),
  recordPayment: (data) => apiClient.post('/payments', data),
  getReceipt: (paymentId) => apiClient.get(`/payments/${paymentId}/receipt`),
  verifyPayment: (id) => apiClient.post(`/payments/${id}/verify`),
  refundPayment: (id, data) => apiClient.post(`/payments/${id}/refund`, data),
  getPaymentSchedule: (bookingId) => apiClient.get(`/payments/booking/${bookingId}/schedule`)
};
