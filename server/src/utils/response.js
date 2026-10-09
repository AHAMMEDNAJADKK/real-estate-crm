export const sendSuccess = (res, message = 'Success', data = null, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data
  };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

export const sendError = (res, message = 'Error', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
