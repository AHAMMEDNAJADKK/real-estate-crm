import { DashboardService } from './dashboard.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getSummary = async (req, res) => {
  try {
    const summary = await DashboardService.getSummary(req.user);
    return sendSuccess(res, 'Dashboard summary retrieved successfully', summary);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getPipeline = async (req, res) => {
  try {
    const pipeline = await DashboardService.getPipeline();
    return sendSuccess(res, 'Sales pipeline metrics retrieved successfully', pipeline);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getPerformance = async (req, res) => {
  try {
    const performance = await DashboardService.getPerformance();
    return sendSuccess(res, 'Employee performance metrics retrieved successfully', performance);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
