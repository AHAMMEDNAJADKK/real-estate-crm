import { BookingsService } from './bookings.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getBookings = async (req, res) => {
  try {
    const result = await BookingsService.getBookings(req.query, req.user);
    return sendSuccess(res, 'Bookings retrieved successfully', result.bookings, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createReservation = async (req, res) => {
  try {
    const booking = await BookingsService.createReservation(req.body, req.user);
    return sendSuccess(res, 'Property reservation created successfully', booking, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await BookingsService.getBookingById(req.params.id);
    return sendSuccess(res, 'Booking retrieved successfully', booking);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const booking = await BookingsService.confirmBooking(req.params.id, req.user);
    return sendSuccess(res, 'Booking confirmed successfully', booking);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await BookingsService.cancelBooking(req.params.id, reason, req.user);
    return sendSuccess(res, 'Booking cancelled successfully', booking);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
