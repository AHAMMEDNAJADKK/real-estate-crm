import User from '../../models/User.js';
import Lead from '../../models/Lead.js';
import Opportunity from '../../models/Opportunity.js';
import Booking from '../../models/Booking.js';
import SiteVisit from '../../models/SiteVisit.js';
import AuditLog from '../../models/AuditLog.js';

export class EmployeesService {
  static async getUsers(query = {}) {
    const { page = 1, limit = 50, role, department, isActive, search } = query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('reportingManager', 'name email role')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    return {
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createUser(data, adminUser) {
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) throw new Error('A user with this email address already exists');

    const user = new User(data);
    await user.save();

    await AuditLog.create({
      user: adminUser._id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: { name: user.name, email: user.email, role: user.role }
    });

    return user;
  }

  static async updateUser(id, data, adminUser) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
      if (existing) throw new Error('Email address is already in use by another account');
    }

    Object.assign(user, data);
    await user.save();

    await AuditLog.create({
      user: adminUser._id,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: { name: user.name, role: user.role, changes: Object.keys(data) }
    });

    return user;
  }

  static async getUserWorkload(id) {
    const [leadsCount, oppsCount, visitsCount, bookingsCount] = await Promise.all([
      Lead.countDocuments({ assignedTo: id }),
      Opportunity.countDocuments({ assignedSalesExecutive: id, stage: { $nin: ['Closed Won', 'Closed Lost'] } }),
      SiteVisit.countDocuments({ assignedExecutive: id, status: 'Completed' }),
      Booking.countDocuments({ bookedBy: id, status: { $in: ['Reserved', 'Confirmed'] } })
    ]);

    return {
      assignedLeads: leadsCount,
      activeOpportunities: oppsCount,
      completedSiteVisits: visitsCount,
      totalBookings: bookingsCount
    };
  }
}
