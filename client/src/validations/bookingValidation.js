/**
 * Booking Validation
 */

export const validateBooking = (data) => {
  const errors = {};

  if (!data.propertyId) {
    errors.propertyId = 'Property unit must be selected';
  }

  if (!data.customerName || !data.customerName.trim()) {
    errors.customerName = 'Customer name is required';
  }

  if (!data.customerPhone || !data.customerPhone.trim()) {
    errors.customerPhone = 'Customer phone number is required';
  }

  if (!data.agreedPrice || Number(data.agreedPrice) <= 0) {
    errors.agreedPrice = 'Agreed purchase price must be greater than 0';
  }

  if (data.discountAmount && Number(data.discountAmount) < 0) {
    errors.discountAmount = 'Discount amount cannot be negative';
  }

  if (data.tokenAmount && Number(data.tokenAmount) < 0) {
    errors.tokenAmount = 'Token amount cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
