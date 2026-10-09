import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import Property from '../../models/Property.js';
import Project from '../../models/Project.js';
import Customer from '../../models/Customer.js';
import PaymentSchedule from '../../models/PaymentSchedule.js';
import Commission from '../../models/Commission.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';

export class BookingsService {
  static async getBookings(query = {}, user) {
    const { page = 1, limit = 20, status, project, customer, search } = query;
    const filter = {};

    if (['sales_executive'].includes(user.role)) {
      filter.bookedBy = user._id;
    }

    if (status) filter.status = status;
    if (project) filter.project = project;
    if (customer) filter.customer = customer;

    if (search) {
      filter.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customer', 'name phone email panNumber')
        .populate('property', 'unitNumber blockOrTower propertyType superBuiltUpAreaSqFt listedPrice')
        .populate('project', 'name code location')
        .populate('bookedBy', 'name email role')
        .populate('confirmedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(filter)
    ]);

    return {
      bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createReservation(data, user) {
    const {
      customerId,
      propertyId,
      discountAmount = 0,
      tokenAmount = 0,
      reservationHours = 72,
      remarks = ''
    } = data;

    // Check discount permission
    if (discountAmount > 0 && !['super_admin', 'admin', 'sales_manager'].includes(user.role)) {
      throw new Error('Only Sales Managers or Administrators can approve property price discounts.');
    }

    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property unit not found');

    // ATOMIC RESERVATION LOCK: Only lock if status is currently 'Available'
    const expiryDate = new Date(Date.now() + reservationHours * 60 * 60 * 1000);
    const lockedProperty = await Property.findOneAndUpdate(
      { _id: propertyId, status: 'Available' },
      {
        $set: {
          status: 'Reserved',
          reservationExpiresAt: expiryDate
        }
      },
      { new: true }
    );

    if (!lockedProperty) {
      throw new Error(`Unit ${property.unitNumber} is not available for reservation (Current status: ${property.status}).`);
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      // Revert lock
      await Property.findByIdAndUpdate(propertyId, { status: 'Available', reservationExpiresAt: null });
      throw new Error('Customer profile not found');
    }

    const listedPrice = property.listedPrice;
    const finalPrice = Math.max(0, listedPrice - Number(discountAmount));
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = new Booking({
      bookingNumber,
      customer: customer._id,
      property: property._id,
      project: property.project,
      bookedBy: user._id,
      status: 'Reserved',
      listedPrice,
      discountAmount: Number(discountAmount),
      finalAgreedPrice: finalPrice,
      bookingTokenAmount: Number(tokenAmount),
      totalPaidAmount: Number(tokenAmount),
      outstandingBalance: finalPrice - Number(tokenAmount),
      reservationExpiresAt: expiryDate,
      remarks
    });

    await booking.save();

    // Link booking to property
    lockedProperty.currentBooking = booking._id;
    await lockedProperty.save();

    // Update customer status to Booked
    customer.status = 'Booked';
    await customer.save();

    await AuditLog.create({
      user: user._id,
      action: 'BOOKING_RESERVED',
      entity: 'Booking',
      entityId: booking._id.toString(),
      details: { bookingNumber, unit: property.unitNumber, finalPrice }
    });

    return booking;
  }

  static async confirmBooking(bookingId, user) {
    if (!['super_admin', 'admin', 'sales_manager'].includes(user.role)) {
      throw new Error('Permission denied. Only Admins or Sales Managers can confirm bookings.');
    }

    const booking = await Booking.findById(bookingId).populate('property');
    if (!booking) throw new Error('Booking not found');

    if (booking.status === 'Confirmed') {
      throw new Error('This booking is already confirmed.');
    }

    if (booking.status === 'Cancelled' || booking.status === 'Expired') {
      throw new Error(`Cannot confirm booking with status ${booking.status}.`);
    }

    // ATOMIC CONFIRMATION LOCK on property
    const confirmedProperty = await Property.findOneAndUpdate(
      { _id: booking.property._id, status: 'Reserved' },
      { $set: { status: 'Booked', currentBooking: booking._id, reservationExpiresAt: null } },
      { new: true }
    );

    if (!confirmedProperty) {
      throw new Error('Failed to confirm. Property status is no longer Reserved.');
    }

    booking.status = 'Confirmed';
    booking.confirmedBy = user._id;
    booking.confirmedAt = new Date();
    await booking.save();

    // Auto-create standard Real Estate Milestone Payment Schedule if not already existing
    const existingSchedule = await PaymentSchedule.findOne({ booking: booking._id });
    if (!existingSchedule) {
      const finalPrice = booking.finalAgreedPrice;
      const initialPaid = booking.totalPaidAmount || 0;

      const schedule = new PaymentSchedule({
        booking: booking._id,
        customer: booking.customer,
        totalAmount: finalPrice,
        installments: [
          {
            milestoneName: 'Booking Advance / Token',
            percentage: 10,
            amountDue: finalPrice * 0.10,
            dueDate: new Date(),
            amountPaid: Math.min(initialPaid, finalPrice * 0.10),
            status: initialPaid >= finalPrice * 0.10 ? 'Paid' : (initialPaid > 0 ? 'Partially Paid' : 'Pending')
          },
          {
            milestoneName: 'Execution of Sale Agreement (20%)',
            percentage: 20,
            amountDue: finalPrice * 0.20,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            amountPaid: 0,
            status: 'Pending'
          },
          {
            milestoneName: 'Foundation & Plinth Level (20%)',
            percentage: 20,
            amountDue: finalPrice * 0.20,
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            amountPaid: 0,
            status: 'Pending'
          },
          {
            milestoneName: 'Structure & Slab Completion (25%)',
            percentage: 25,
            amountDue: finalPrice * 0.25,
            dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            amountPaid: 0,
            status: 'Pending'
          },
          {
            milestoneName: 'Flooring, Fixtures & Finishing (15%)',
            percentage: 15,
            amountDue: finalPrice * 0.15,
            dueDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000),
            amountPaid: 0,
            status: 'Pending'
          },
          {
            milestoneName: 'Possession & Key Handover (10%)',
            percentage: 10,
            amountDue: finalPrice * 0.10,
            dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            amountPaid: 0,
            status: 'Pending'
          }
        ]
      });
      await schedule.save();
    }

    // Auto-create Commission record for the booking agent
    const existingCommission = await Commission.findOne({ booking: booking._id, agent: booking.bookedBy });
    if (!existingCommission) {
      const agentRate = 1.0; // 1% default
      const commissionAmount = (booking.finalAgreedPrice * agentRate) / 100;
      await Commission.create({
        booking: booking._id,
        agent: booking.bookedBy,
        commissionType: 'Percentage',
        rate: agentRate,
        saleValue: booking.finalAgreedPrice,
        commissionAmount,
        status: 'Pending'
      });
    }

    await AuditLog.create({
      user: user._id,
      action: 'BOOKING_CONFIRMED',
      entity: 'Booking',
      entityId: booking._id.toString(),
      details: { bookingNumber: booking.bookingNumber, confirmedBy: user.name }
    });

    await Notification.create({
      recipient: booking.bookedBy,
      title: 'Booking Confirmed!',
      message: `Booking ${booking.bookingNumber} for unit ${confirmedProperty.unitNumber} has been confirmed.`,
      type: 'booking',
      link: `/bookings/${booking._id}`
    });

    return booking;
  }

  static async cancelBooking(bookingId, cancellationReason, user) {
    if (!['super_admin', 'admin', 'sales_manager'].includes(user.role)) {
      throw new Error('Permission denied. Only Admins or Sales Managers can cancel bookings.');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.status === 'Cancelled') {
      throw new Error('Booking is already cancelled.');
    }

    // Release Property back to Available
    await Property.findByIdAndUpdate(booking.property, {
      status: 'Available',
      currentBooking: null,
      reservationExpiresAt: null
    });

    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = user._id;
    booking.cancellationReason = cancellationReason || 'Cancelled by management';
    await booking.save();

    await AuditLog.create({
      user: user._id,
      action: 'BOOKING_CANCELLED',
      entity: 'Booking',
      entityId: booking._id.toString(),
      details: { bookingNumber: booking.bookingNumber, reason: booking.cancellationReason }
    });

    return booking;
  }

  static async getBookingById(id) {
    const booking = await Booking.findById(id)
      .populate('customer', 'name phone email panNumber address customerType')
      .populate('property')
      .populate('project', 'name code location developer')
      .populate('bookedBy', 'name email role')
      .populate('confirmedBy', 'name email role')
      .populate('cancelledBy', 'name email role');

    if (!booking) throw new Error('Booking not found');
    return booking;
  }
}
