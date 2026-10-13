import mongoose from 'mongoose';
import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
    }

    const { email, password } = req.body || {};
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await AuthService.login(email, password, ip, userAgent);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    const statusCode = error.statusCode || (error.name?.includes('Mongo') ? 503 : 500);
    return sendError(res, error.message || 'Authentication failed due to a server error', statusCode);
  }
};

export const getMe = async (req, res) => {
  try {
    return sendSuccess(res, 'User profile fetched successfully', req.user);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const logout = async (req, res) => {
  return sendSuccess(res, 'Logged out successfully', null);
};
