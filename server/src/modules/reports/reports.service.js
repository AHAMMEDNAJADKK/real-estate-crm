import Lead from '../../models/Lead.js';
import Booking from '../../models/Booking.js';
import CallLog from '../../models/CallLog.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';

export class ReportsService {
  static async generateReport(reportType, query = {}) {
    const { startDate, endDate, project } = query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    switch (reportType) {
      case 'lead-source': {
        const match = {};
        if (startDate || endDate) match.createdAt = dateFilter;
        const data = await Lead.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$source',
              totalLeads: { $sum: 1 },
              convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
              lostLeads: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } }
            }
          },
          { $sort: { totalLeads: -1 } }
        ]);
        return data;
      }

      case 'lead-temperature': {
        const match = {};
        if (startDate || endDate) match.createdAt = dateFilter;
        const data = await Lead.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$temperature',
              count: { $sum: 1 }
            }
          }
        ]);
        return data;
      }

      case 'sales-summary': {
        const match = { status: { $in: ['Reserved', 'Confirmed'] } };
        if (startDate || endDate) match.createdAt = dateFilter;
        if (project) match.project = project;

        const data = await Booking.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$project',
              totalBookings: { $sum: 1 },
              totalSalesValue: { $sum: '$finalAgreedPrice' },
              totalCollected: { $sum: '$totalPaidAmount' },
              totalOutstanding: { $sum: '$outstandingBalance' }
            }
          }
        ]);
        await Booking.populate(data, { path: '_id', select: 'name code location' });
        return data;
      }

      case 'telecaller-performance': {
        const match = {};
        if (startDate || endDate) match.createdAt = dateFilter;
        const data = await CallLog.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$telecaller',
              totalCalls: { $sum: 1 },
              connectedCalls: { $sum: { $cond: [{ $in: ['$callOutcome', ['Connected', 'Interested']] }, 1, 0] } },
              totalDurationSeconds: { $sum: '$callDurationSeconds' }
            }
          },
          { $sort: { totalCalls: -1 } }
        ]);
        await User.populate(data, { path: '_id', select: 'name email role department' });
        return data;
      }

      default:
        throw new Error(`Invalid report type: ${reportType}`);
    }
  }
}
