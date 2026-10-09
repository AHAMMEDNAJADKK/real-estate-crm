import { CommissionsService } from './commissions.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getCommissions = async (req, res) => {
  try {
    const result = await CommissionsService.getCommissions(req.query, req.user);
    return sendSuccess(res, 'Commissions retrieved successfully', result.commissions, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const approveCommission = async (req, res) => {
  try {
    const commission = await CommissionsService.approveCommission(req.params.id, req.user);
    return sendSuccess(res, 'Commission approved successfully', commission);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const payoutCommission = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const commission = await CommissionsService.payoutCommission(req.params.id, paymentReference, req.user);
    return sendSuccess(res, 'Commission marked paid and ledger entry recorded', commission);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
