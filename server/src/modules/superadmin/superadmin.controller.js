import mongoose from 'mongoose';
import User, { USER_ROLES } from '../../models/User.js';
import Project from '../../models/Project.js';
import Property from '../../models/Property.js';
import Lead from '../../models/Lead.js';
import Customer from '../../models/Customer.js';
import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import AuditLog from '../../models/AuditLog.js';
import { config } from '../../config/environment.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getSystemOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleAgg,
      totalProjects,
      totalProperties,
      availableProperties,
      totalLeads,
      totalCustomers,
      totalBookings,
      paymentsAgg,
      recentAuditLogs
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Project.countDocuments({}),
      Property.countDocuments({}),
      Property.countDocuments({ status: 'Available' }),
      Lead.countDocuments({}),
      Customer.countDocuments({}),
      Booking.countDocuments({}),
      Payment.aggregate([
        { $match: { status: 'Successful' } },
        {
          $group: {
            _id: null,
            totalRevenueCollected: { $sum: '$amount' }
          }
        }
      ]),
      AuditLog.find({})
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(15)
    ]);

    const roleBreakdown = {};
    for (const item of roleAgg) {
      roleBreakdown[item._id] = item.count;
    }

    const superAdmins = (roleBreakdown.superadmin || 0) + (roleBreakdown.super_admin || 0);
    const admins = roleBreakdown.admin || 0;
    const managers = (roleBreakdown.sales_manager || 0) + (roleBreakdown.property_manager || 0);
    const staff =
      (roleBreakdown.telecaller || 0) +
      (roleBreakdown.sales_executive || 0) +
      (roleBreakdown.accountant || 0);

    return sendSuccess(res, 'Super Admin system overview retrieved successfully', {
      userStats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        superAdmins,
        admins,
        managers,
        staff,
        roleBreakdown
      },
      crmStats: {
        totalProjects,
        totalProperties,
        availableProperties,
        totalLeads,
        totalCustomers,
        totalBookings,
        totalRevenueCollected: paymentsAgg[0]?.totalRevenueCollected || 0
      },
      systemHealth: {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        dbName: mongoose.connection.name || 'realestate_crm',
        environment: config.nodeEnv,
        uptimeSeconds: Math.floor(process.uptime())
      },
      recentAuditLogs
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getSuperAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 25, role, isActive, search } = req.query;
    const filter = {};

    if (role) {
      if (role === 'superadmin' || role === 'super_admin') {
        filter.role = { $in: ['superadmin', 'super_admin'] };
      } else {
        filter.role = role;
      }
    }
    if (isActive !== undefined && isActive !== '') {
      filter.isActive = String(isActive) === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 25);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('reportingManager', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    return sendSuccess(res, 'Users retrieved successfully', users, 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createSuperAdminUser = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'admin', department = 'Management', commissionRate } = req.body;

    if (!USER_ROLES.includes(role)) {
      return sendError(res, `Invalid role specified. Allowed roles: ${USER_ROLES.join(', ')}`, 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return sendError(res, 'A user with this email address already exists', 400);
    }

    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: String(password),
      role,
      department: department || 'Management',
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : 1.0,
      isActive: true
    });

    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'SUPERADMIN_USER_CREATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: { name: user.name, email: user.email, role: user.role, department: user.department },
      ipAddress: req.ip || ''
    });

    return sendSuccess(res, 'User account created successfully by Super Admin', user, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateSuperAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, department, isActive, password, commissionRate } = req.body;

    const targetUser = await User.findById(id).select('+password');
    if (!targetUser) {
      return sendError(res, 'Target user not found', 404);
    }

    const isSelf = targetUser._id.toString() === req.user._id.toString();

    if (isSelf && isActive === false) {
      return sendError(res, 'Super Admin cannot deactivate their own active account', 400);
    }

    if (isSelf && role && !['superadmin', 'super_admin'].includes(role)) {
      return sendError(res, 'Super Admin cannot demote their own active role', 400);
    }

    if (role && !USER_ROLES.includes(role)) {
      return sendError(res, `Invalid role. Allowed roles: ${USER_ROLES.join(', ')}`, 400);
    }

    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const duplicate = await User.findOne({ email: email.toLowerCase().trim() });
      if (duplicate) {
        return sendError(res, 'Email address is already in use by another account', 400);
      }
      targetUser.email = email.toLowerCase().trim();
    }

    if (name !== undefined) targetUser.name = String(name).trim();
    if (phone !== undefined) targetUser.phone = String(phone).trim();
    if (role !== undefined) targetUser.role = role;
    if (department !== undefined) targetUser.department = String(department).trim();
    if (typeof isActive === 'boolean') targetUser.isActive = isActive;
    if (commissionRate !== undefined) targetUser.commissionRate = Number(commissionRate);
    if (password && String(password).trim().length >= 6) {
      targetUser.password = String(password).trim();
    }

    await targetUser.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'SUPERADMIN_USER_UPDATED',
      entity: 'User',
      entityId: targetUser._id.toString(),
      details: {
        targetEmail: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
        updatedFields: Object.keys(req.body).filter((k) => k !== 'password')
      },
      ipAddress: req.ip || ''
    });

    return sendSuccess(res, 'User account updated successfully', targetUser.toJSON());
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteSuperAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return sendError(res, 'Target user not found', 404);
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return sendError(res, 'Super Admin cannot delete their own active account', 400);
    }

    const deletedSummary = {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role
    };

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      user: req.user._id,
      action: 'SUPERADMIN_USER_DELETED',
      entity: 'User',
      entityId: deletedSummary.id,
      details: deletedSummary,
      ipAddress: req.ip || ''
    });

    return sendSuccess(res, 'User account deleted successfully', deletedSummary);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getSuperAdminAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, action, entity } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter)
    ]);

    return sendSuccess(res, 'System audit logs retrieved successfully', logs, 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
