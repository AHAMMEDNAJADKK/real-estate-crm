import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await AuthService.login(email, password, ip, userAgent);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    return sendError(res, error.message, 401);
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
