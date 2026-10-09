import Transaction from '../../models/Transaction.js';
import AuditLog from '../../models/AuditLog.js';

export class AccountsService {
  static async getTransactions(query = {}) {
    const { page = 1, limit = 20, type, category, accountType, startDate, endDate, search } = query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (accountType) filter.accountType = accountType;

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('recordedBy', 'name email role')
        .populate('booking', 'bookingNumber')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter)
    ]);

    return {
      transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createTransaction(data, user) {
    const transactionNumber = `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = new Transaction({
      ...data,
      transactionNumber,
      recordedBy: user._id
    });
    await transaction.save();

    await AuditLog.create({
      user: user._id,
      action: 'TRANSACTION_RECORDED',
      entity: 'Transaction',
      entityId: transaction._id.toString(),
      details: { transactionNumber, type: transaction.type, amount: transaction.amount, category: transaction.category }
    });

    return transaction;
  }

  static async getReconciliationSummary() {
    const incomeAgg = await Transaction.aggregate([
      { $match: { type: 'INCOME' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenseAgg = await Transaction.aggregate([
      { $match: { type: 'EXPENSE' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const categoryBreakdown = await Transaction.aggregate([
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 }, type: { $first: '$type' } } }
    ]);

    const totalIncome = incomeAgg.length > 0 ? incomeAgg[0].total : 0;
    const totalExpense = expenseAgg.length > 0 ? expenseAgg[0].total : 0;

    return {
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      categoryBreakdown
    };
  }
}
