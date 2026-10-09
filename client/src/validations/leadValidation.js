/**
 * Lead Form Validation Schema & Validator
 */

export const validateLead = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Lead contact name is required';
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = 'Mobile number is required';
  } else {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
  }

  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
  }

  if (data.budget && isNaN(Number(data.budget))) {
    errors.budget = 'Budget must be a valid number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
