import Lead from '../../models/Lead.js';
import CallLog from '../../models/CallLog.js';
import FollowUp from '../../models/FollowUp.js';
import Meeting from '../../models/Meeting.js';
import SiteVisit from '../../models/SiteVisit.js';
import Opportunity from '../../models/Opportunity.js';
import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import Property from '../../models/Property.js';
import User from '../../models/User.js';

export class DashboardService {
  static async getSummary(user) {
    const isRestricted = ['telecaller', 'sales_executive'].includes(user.role);
    const leadFilter = isRestricted ? { assignedTo: user._id } : {};
    const taskFilter = isRestricted ? { assignedTo: user._id } : {};
    const bookingFilter = isRestricted ? { bookedBy: user._id } : {};

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      newLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      switchedOffLeads,
      rntLeads,
      todayCalls,
      pendingFollowups,
      upcomingMeetings,
      upcomingVisits,
      bookingsAgg,
      paymentsAgg,
      inventoryAgg
    ] = await Promise.all([
      Lead.countDocuments(leadFilter),
      Lead.countDocuments({ ...leadFilter, status: 'New' }),
      Lead.countDocuments({ ...leadFilter, temperature: 'Hot' }),
      Lead.countDocuments({ ...leadFilter, temperature: 'Warm' }),
      Lead.countDocuments({ ...leadFilter, temperature: 'Cold' }),
      Lead.countDocuments({ ...leadFilter, temperature: 'SwitchedOff' }),
      Lead.countDocuments({ ...leadFilter, temperature: 'RNT' }),
      CallLog.countDocuments({
        ...(isRestricted ? { telecaller: user._id } : {}),
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }),
      FollowUp.countDocuments({
        ...taskFilter,
        status: 'Pending',
        scheduledDate: { $lte: endOfToday }
      }),
      Meeting.countDocuments({
        ...(isRestricted ? { assignedEmployee: user._id } : {}),
        status: 'Scheduled',
        scheduledDate: { $gte: startOfToday }
      }),
      SiteVisit.countDocuments({
        ...(isRestricted ? { assignedExecutive: user._id } : {}),
        status: 'Scheduled',
        visitDate: { $gte: startOfToday }
      }),
      Booking.aggregate([
        { $match: bookingFilter },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
            },
            totalSalesValue: {
              $sum: { $cond: [{ $in: ['$status', ['Reserved', 'Confirmed']] }, '$finalAgreedPrice', 0] }
            },
            totalPaid: { $sum: '$totalPaidAmount' },
            totalOutstanding: { $sum: '$outstandingBalance' }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { status: 'Successful' } },
        {
          $group: {
            _id: null,
            totalCollections: { $sum: '$amount' }
          }
        }
      ]),
      Property.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const bookingStats = bookingsAgg[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      totalSalesValue: 0,
      totalPaid: 0,
      totalOutstanding: 0
    };

    const totalCollections = paymentsAgg[0]?.totalCollections || 0;

    const inventory = {
      Available: 0,
      Reserved: 0,
      Booked: 0,
      Sold: 0,
      OnHold: 0
    };
    inventoryAgg.forEach(item => {
      const key = item._id ? item._id.replace(/\s+/g, '') : 'Available';
      inventory[key] = item.count;
    });

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        hot: hotLeads,
        warm: warmLeads,
        cold: coldLeads,
        switchedOff: switchedOffLeads,
        rnt: rntLeads
      },
      operations: {
        todayCalls,
        pendingFollowups,
        upcomingMeetings,
        upcomingVisits
      },
      sales: {
        totalBookings: bookingStats.totalBookings,
        confirmedBookings: bookingStats.confirmedBookings,
        totalSalesValue: bookingStats.totalSalesValue,
        totalCollected: totalCollections,
        outstandingBalance: bookingStats.totalOutstanding
      },
      inventory
    };
  }

  static async getPipeline() {
    const pipeline = await Opportunity.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          expectedValue: { $sum: '$expectedRevenue' }
        }
      }
    ]);

    return pipeline;
  }

  static async getPerformance() {
    const topSales = await Booking.aggregate([
      { $match: { status: { $in: ['Reserved', 'Confirmed'] } } },
      {
        $group: {
          _id: '$bookedBy',
          totalBookings: { $sum: 1 },
          salesValue: { $sum: '$finalAgreedPrice' }
        }
      },
      { $sort: { salesValue: -1 } },
      { $limit: 5 }
    ]);

    await User.populate(topSales, { path: '_id', select: 'name email role department' });

    return {
      topSalesExecutives: topSales.map(t => ({
        user: t._id,
        totalBookings: t.totalBookings,
        salesValue: t.salesValue
      }))
    };
  }
}
