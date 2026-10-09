import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import Receipt from '../../models/Receipt.js';
import PaymentSchedule from '../../models/PaymentSchedule.js';
import Transaction from '../../models/Transaction.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';

export class PaymentsService {
  static async getPayments(query = {}, user) {
    const { page = 1, limit = 20, bookingId, status, search } = query;
    const filter = {};

    if (bookingId) filter.booking = bookingId;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { transactionReference: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('booking', 'bookingNumber finalAgreedPrice totalPaidAmount outstandingBalance')
        .populate('customer', 'name phone email')
        .populate('recordedBy', 'name email role')
        .populate('verifiedBy', 'name email role')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter)
    ]);

    return {
      payments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async recordPayment(data, user) {
    const {
      bookingId,
      amount,
      paymentMethod = 'Bank Transfer (NEFT/RTGS)',
      transactionReference = '',
      installmentId,
      notes = ''
    } = data;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      throw new Error('Valid positive payment amount is required');
    }

    const booking = await Booking.findById(bookingId).populate('customer');
    if (!booking) throw new Error('Booking not found');

    if (booking.status === 'Cancelled') {
      throw new Error('Cannot record payment for a cancelled booking');
    }

    // DUPLICATE TRANSACTION PREVENTION
    if (transactionReference && transactionReference.trim() !== '') {
      const duplicateTx = await Payment.findOne({
        transactionReference: transactionReference.trim(),
        status: { $ne: 'Failed' }
      });
      if (duplicateTx) {
        throw new Error(`Duplicate payment reference detected: ${transactionReference} already processed under payment ${duplicateTx.paymentNumber}`);
      }
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = new Payment({
      paymentNumber,
      booking: booking._id,
      customer: booking.customer._id,
      installmentId,
      amount: parsedAmount,
      paymentMethod,
      transactionReference: transactionReference.trim(),
      status: 'Successful',
      recordedBy: user._id,
      verifiedBy: user._id,
      verifiedAt: new Date(),
      notes
    });

    // Auto-generate official Receipt
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    payment.receiptNumber = receiptNumber;
    await payment.save();

    await Receipt.create({
      receiptNumber,
      payment: payment._id,
      booking: booking._id,
      customer: booking.customer._id,
      amount: parsedAmount,
      issuedBy: user._id,
      remarks: `Payment for booking ${booking.bookingNumber} via ${paymentMethod}`
    });

    // RECALCULATE BOOKING BALANCES FROM DATABASE
    const successfulPayments = await Payment.find({
      booking: booking._id,
      status: 'Successful'
    });
    const totalPaid = successfulPayments.reduce((acc, p) => acc + (p.amount - (p.refundAmount || 0)), 0);
    booking.totalPaidAmount = totalPaid;
    booking.outstandingBalance = Math.max(0, booking.finalAgreedPrice - totalPaid);
    await booking.save();

    // UPDATE MILESTONE PAYMENT SCHEDULE IF PRESENT
    const schedule = await PaymentSchedule.findOne({ booking: booking._id });
    if (schedule && schedule.installments) {
      let unallocated = parsedAmount;
      for (const inst of schedule.installments) {
        if (unallocated <= 0) break;
        const due = inst.amountDue - inst.amountPaid;
        if (due > 0) {
          const allocate = Math.min(unallocated, due);
          inst.amountPaid += allocate;
          unallocated -= allocate;
          if (inst.amountPaid >= inst.amountDue) {
            inst.status = 'Paid';
          } else {
            inst.status = 'Partially Paid';
          }
        }
      }
      await schedule.save();
    }

    // CREATE AUDITABLE ACCOUNTING TRANSACTION
    await Transaction.create({
      transactionNumber: `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'INCOME',
      category: 'Booking Collection',
      amount: parsedAmount,
      booking: booking._id,
      payment: payment._id,
      accountType: paymentMethod.includes('Cash') ? 'Cash in Hand' : 'Bank Account',
      referenceNumber: transactionReference || paymentNumber,
      description: `Collection for booking ${booking.bookingNumber} (${paymentMethod})`,
      recordedBy: user._id
    });

    await AuditLog.create({
      user: user._id,
      action: 'PAYMENT_RECORDED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: { paymentNumber, amount: parsedAmount, bookingNumber: booking.bookingNumber }
    });

    return payment;
  }

  static async verifyPayment(paymentId, user) {
    if (!['super_admin', 'admin', 'accountant'].includes(user.role)) {
      throw new Error('Permission denied. Only Accountants or Admins can verify payments.');
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = 'Successful';
    payment.verifiedBy = user._id;
    payment.verifiedAt = new Date();
    await payment.save();

    return payment;
  }

  static async refundPayment(paymentId, refundAmount, reason, user) {
    if (!['super_admin', 'admin', 'accountant'].includes(user.role)) {
      throw new Error('Permission denied. Only Accountants or Admins can issue refunds.');
    }

    const payment = await Payment.findById(paymentId).populate('booking');
    if (!payment) throw new Error('Payment not found');

    const refund = Number(refundAmount);
    if (!refund || refund <= 0 || refund > payment.amount) {
      throw new Error(`Refund amount must be between 1 and original payment of ₹${payment.amount}`);
    }

    payment.refundAmount = (payment.refundAmount || 0) + refund;
    payment.refundReason = reason || 'Customer cancellation/adjustment refund';
    payment.refundDate = new Date();
    if (payment.refundAmount >= payment.amount) {
      payment.status = 'Refunded';
    }
    await payment.save();

    // Reconcile booking balance
    const booking = payment.booking;
    const successfulPayments = await Payment.find({
      booking: booking._id,
      status: { $in: ['Successful', 'Refunded'] }
    });
    const netPaid = successfulPayments.reduce((acc, p) => acc + (p.amount - (p.refundAmount || 0)), 0);
    booking.totalPaidAmount = netPaid;
    booking.outstandingBalance = Math.max(0, booking.finalAgreedPrice - netPaid);
    await booking.save();

    // Traceable Refund accounting entry
    await Transaction.create({
      transactionNumber: `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'EXPENSE',
      category: 'Customer Refund',
      amount: refund,
      booking: booking._id,
      payment: payment._id,
      accountType: 'Bank Account',
      referenceNumber: `REFUND-${payment.paymentNumber}`,
      description: `Refund for payment ${payment.paymentNumber}: ${reason}`,
      recordedBy: user._id
    });

    await AuditLog.create({
      user: user._id,
      action: 'PAYMENT_REFUNDED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: { refundAmount: refund, reason }
    });

    return payment;
  }

  static async getReceiptByPayment(paymentId) {
    const receipt = await Receipt.findOne({ payment: paymentId })
      .populate('booking')
      .populate('customer')
      .populate('issuedBy', 'name email');

    if (!receipt) throw new Error('Receipt not found');
    return receipt;
  }

  static async getPaymentSchedule(bookingId) {
    const schedule = await PaymentSchedule.findOne({ booking: bookingId })
      .populate('booking', 'bookingNumber finalAgreedPrice totalPaidAmount outstandingBalance');

    if (!schedule) throw new Error('Payment schedule not found for this booking');
    return schedule;
  }
}
