import { ReportsService } from './reports.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getReport = async (req, res) => {
  try {
    const data = await ReportsService.generateReport(req.params.reportType, req.query);
    return sendSuccess(res, `Report ${req.params.reportType} generated successfully`, data);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
