import { MeetingsService } from './meetings.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getMeetings = async (req, res) => {
  try {
    const result = await MeetingsService.getMeetings(req.query, req.user);
    return sendSuccess(res, 'Meetings retrieved successfully', result.meetings, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createMeeting = async (req, res) => {
  try {
    const meeting = await MeetingsService.createMeeting(req.body, req.user);
    return sendSuccess(res, 'Meeting created successfully', meeting, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const meeting = await MeetingsService.updateMeeting(req.params.id, req.body);
    return sendSuccess(res, 'Meeting updated successfully', meeting);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
