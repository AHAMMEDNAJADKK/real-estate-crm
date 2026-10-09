import { Booking } from '../models/Booking.js';
import { Property } from '../models/Property.js';
import { FollowUp } from '../models/FollowUp.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/**
 * Sweeps for expired unit reservations and releases properties back to Available
 */
export const checkExpiredReservations = async () => {
  try {
    const now = new Date();
    const expiredBookings = await Booking.find({
      status: 'Reserved',
      reservationExpiresAt: { $ne: null, $lt: now }
    });

    for (const booking of expiredBookings) {
      booking.status = 'Expired';
      booking.cancellationReason = 'Reservation expired automatically due to non-payment of token advance';
      booking.cancelledAt = now;
      await booking.save();

      // Release property back to Available
      await Property.findByIdAndUpdate(booking.property, {
        status: 'Available',
        $unset: { currentBooking: '' }
      });

      await AuditLog.create({
        action: 'RESERVATION_EXPIRED',
        entity: 'Booking',
        entityId: booking._id,
        changes: { status: 'Expired', propertyReleased: booking.property }
      });

      logger.info(`[Scheduler] Auto-expired reservation ${booking.bookingNumber} and released unit.`);
    }
  } catch (err) {
    logger.error(`[Scheduler Error: Expired Reservations]: ${err.message}`);
  }
};

/**
 * Sweeps for overdue follow-up tasks and updates status
 */
export const checkOverdueFollowUps = async () => {
  try {
    const now = new Date();
    const result = await FollowUp.updateMany(
      {
        status: 'Pending',
        scheduledDate: { $lt: now }
      },
      {
        $set: { status: 'Overdue' }
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`[Scheduler] Updated ${result.modifiedCount} pending follow-ups to Overdue status.`);
    }
  } catch (err) {
    logger.error(`[Scheduler Error: Overdue FollowUps]: ${err.message}`);
  }
};

/**
 * Initializes recurring background sweeps
 */
export const startScheduledJobs = () => {
  // Run on startup
  checkExpiredReservations();
  checkOverdueFollowUps();

  // Run every 10 minutes (600,000 ms)
  const interval = setInterval(() => {
    checkExpiredReservations();
    checkOverdueFollowUps();
  }, 10 * 60 * 1000);

  // Unref interval so it does not block graceful process termination
  if (interval.unref) {
    interval.unref();
  }

  logger.info('[Scheduler] Background jobs initialized for reservation expiry and follow-up tracking.');
};
