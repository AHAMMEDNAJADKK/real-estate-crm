import { AccountsService } from './accounts.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getTransactions = async (req, res) => {
  try {
    const result = await AccountsService.getTransactions(req.query);
    return sendSuccess(res, 'Transactions retrieved successfully', result.transactions, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createTransaction = async (req, res) => {
  try {
    const transaction = await AccountsService.createTransaction(req.body, req.user);
    return sendSuccess(res, 'Transaction recorded successfully', transaction, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getReconciliationSummary = async (req, res) => {
  try {
    const summary = await AccountsService.getReconciliationSummary();
    return sendSuccess(res, 'Financial reconciliation summary retrieved', summary);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
