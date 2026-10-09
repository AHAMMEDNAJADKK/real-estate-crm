/**
 * Payment Validation
 */

export const validatePayment = (data) => {
  const errors = {};

  if (!data.bookingId) {
    errors.bookingId = 'Booking contract must be selected';
  }

  if (!data.amount || Number(data.amount) <= 0) {
    errors.amount = 'Payment amount must be greater than 0';
  }

  if (!data.paymentMode) {
    errors.paymentMode = 'Payment mode must be specified';
  }

  if (['Cheque', 'Bank Transfer', 'NEFT/RTGS', 'UPI'].includes(data.paymentMode)) {
    if (!data.transactionReference || !data.transactionReference.trim()) {
      errors.transactionReference = `Transaction / Cheque reference is mandatory for ${data.paymentMode}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
