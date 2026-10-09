import { Router } from 'express';
import {
  getBookings,
  createReservation,
  getBookingById,
  confirmBooking,
  cancelBooking
} from './bookings.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getBookings);
router.post('/', validateRequest(['customerId', 'propertyId']), createReservation);
router.get('/:id', getBookingById);
router.post('/:id/confirm', authorize('super_admin', 'admin', 'sales_manager'), confirmBooking);
router.post('/:id/cancel', authorize('super_admin', 'admin', 'sales_manager'), cancelBooking);

export default router;
