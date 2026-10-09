import Commission from '../../models/Commission.js';
import Transaction from '../../models/Transaction.js';
import AuditLog from '../../models/AuditLog.js';

export class CommissionsService {
  static async getCommissions(query = {}, user) {
    const { page = 1, limit = 20, status, agentId } = query;
    const filter = {};

    if (['sales_executive'].includes(user.role)) {
      filter.agent = user._id;
    } else if (agentId) {
      filter.agent = agentId;
    }

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [commissions, total] = await Promise.all([
      Commission.find(filter)
        .populate('agent', 'name email role department')
        .populate({
          path: 'booking',
          select: 'bookingNumber finalAgreedPrice',
          populate: { path: 'property', select: 'unitNumber' }
        })
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Commission.countDocuments(filter)
    ]);

    return {
      commissions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async approveCommission(id, user) {
    if (!['super_admin', 'admin', 'sales_manager'].includes(user.role)) {
      throw new Error('Permission denied. Only Admins or Sales Managers can approve commissions.');
    }

    const commission = await Commission.findById(id);
    if (!commission) throw new Error('Commission record not found');

    commission.status = 'Approved';
    commission.approvedBy = user._id;
    commission.approvedAt = new Date();
    await commission.save();

    await AuditLog.create({
      user: user._id,
      action: 'COMMISSION_APPROVED',
      entity: 'Commission',
      entityId: commission._id.toString(),
      details: { amount: commission.commissionAmount }
    });

    return commission;
  }

  static async payoutCommission(id, paymentReference, user) {
    if (!['super_admin', 'admin', 'accountant'].includes(user.role)) {
      throw new Error('Permission denied. Only Admins or Accountants can mark commission as paid.');
    }

    const commission = await Commission.findById(id).populate('booking agent');
    if (!commission) throw new Error('Commission record not found');

    if (commission.status !== 'Approved') {
      throw new Error('Only approved commissions can be paid out.');
    }

    commission.status = 'Paid';
    commission.paidAt = new Date();
    commission.paymentReference = paymentReference || `COMM-PAY-${Date.now().toString().slice(-6)}`;
    await commission.save();

    // Traceable Expense in accounts
    await Transaction.create({
      transactionNumber: `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'EXPENSE',
      category: 'Brokerage Payout',
      amount: commission.commissionAmount,
      booking: commission.booking._id,
      accountType: 'Bank Account',
      referenceNumber: commission.paymentReference,
      description: `Commission payout to ${commission.agent.name} for booking ${commission.booking.bookingNumber}`,
      recordedBy: user._id
    });

    await AuditLog.create({
      user: user._id,
      action: 'COMMISSION_PAID',
      entity: 'Commission',
      entityId: commission._id.toString(),
      details: { amount: commission.commissionAmount, reference: commission.paymentReference }
    });

    return commission;
  }
}
