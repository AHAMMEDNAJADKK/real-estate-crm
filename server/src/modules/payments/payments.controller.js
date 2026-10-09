import { PaymentsService } from './payments.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getPayments = async (req, res) => {
  try {
    const result = await PaymentsService.getPayments(req.query, req.user);
    return sendSuccess(res, 'Payments retrieved successfully', result.payments, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const recordPayment = async (req, res) => {
  try {
    const payment = await PaymentsService.recordPayment(req.body, req.user);
    return sendSuccess(res, 'Payment recorded successfully', payment, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const payment = await PaymentsService.verifyPayment(req.params.id, req.user);
    return sendSuccess(res, 'Payment verified successfully', payment);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    const payment = await PaymentsService.refundPayment(req.params.id, refundAmount, reason, req.user);
    return sendSuccess(res, 'Payment refund processed successfully', payment);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getReceipt = async (req, res) => {
  try {
    const receipt = await PaymentsService.getReceiptByPayment(req.params.id);
    return sendSuccess(res, 'Receipt retrieved successfully', receipt);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const getPaymentSchedule = async (req, res) => {
  try {
    const schedule = await PaymentsService.getPaymentSchedule(req.params.id);
    return sendSuccess(res, 'Payment schedule retrieved successfully', schedule);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};
