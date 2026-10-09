import { TelecallersService } from './telecallers.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getCallLogs = async (req, res) => {
  try {
    const result = await TelecallersService.getCallLogs(req.query, req.user);
    return sendSuccess(res, 'Call logs retrieved successfully', result.callLogs, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const recordCallLog = async (req, res) => {
  try {
    const callLog = await TelecallersService.recordCallLog(req.body, req.user);
    return sendSuccess(res, 'Call log recorded successfully', callLog, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getFollowUps = async (req, res) => {
  try {
    const result = await TelecallersService.getFollowUps(req.query, req.user);
    return sendSuccess(res, 'Follow-ups retrieved successfully', result.followUps, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createFollowUp = async (req, res) => {
  try {
    const followUp = await TelecallersService.createFollowUp(req.body, req.user);
    return sendSuccess(res, 'Follow-up created successfully', followUp, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateFollowUp = async (req, res) => {
  try {
    const followUp = await TelecallersService.updateFollowUp(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Follow-up updated successfully', followUp);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getCallingQueue = async (req, res) => {
  try {
    const queue = await TelecallersService.getTelecallerCallingQueue(req.user);
    return sendSuccess(res, 'Calling queue retrieved successfully', queue);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
