import mongoose from 'mongoose';
import CallLog from '../../models/CallLog.js';
import FollowUp from '../../models/FollowUp.js';
import Lead from '../../models/Lead.js';
import Notification from '../../models/Notification.js';

export class TelecallersService {
  static async getCallLogs(query = {}, user) {
    const { page = 1, limit = 20, leadId, telecallerId } = query;
    const filter = {};

    if (leadId) filter.lead = leadId;
    if (telecallerId) filter.telecaller = telecallerId;
    else if (user.role === 'telecaller') filter.telecaller = user._id;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [callLogs, total] = await Promise.all([
      CallLog.find(filter)
        .populate('lead', 'leadName phone status temperature')
        .populate('telecaller', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CallLog.countDocuments(filter)
    ]);

    return {
      callLogs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async recordCallLog(data, user) {
    const { leadId, callOutcome, temperature, notes, callDurationSeconds, nextFollowUpDate } = data;

    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    const callLog = new CallLog({
      lead: lead._id,
      telecaller: user._id,
      callOutcome,
      temperature: temperature || lead.temperature,
      notes: notes || '',
      callDurationSeconds: callDurationSeconds || 0,
      scheduledNextFollowUp: nextFollowUpDate ? new Date(nextFollowUpDate) : null
    });
    await callLog.save();

    // Update lead's temperature, remarks, and lastContactedAt
    lead.temperature = temperature || lead.temperature;
    lead.lastContactedAt = new Date();
    if (notes) lead.remarks = notes;
    if (lead.status === 'New') lead.status = 'Contacted';

    // If next follow up is scheduled, create FollowUp record
    if (nextFollowUpDate) {
      lead.nextFollowUpDate = new Date(nextFollowUpDate);
      await FollowUp.create({
        lead: lead._id,
        assignedTo: user._id,
        scheduledDate: new Date(nextFollowUpDate),
        notes: notes || 'Scheduled from call outcome',
        status: 'Pending'
      });
    }
    await lead.save();

    return callLog;
  }

  static async getFollowUps(query = {}, user) {
    const {
      page = 1,
      limit = 10,
      status,
      date,
      startDate,
      endDate,
      overdue,
      timeframe,
      priority,
      assignedTo,
      leadId,
      search,
      sortBy
    } = query;

    const filter = {};
    const conditions = [];

    // Role-based visibility scoping: telecallers and sales executives see only their own
    if (['telecaller', 'sales_executive'].includes(user.role)) {
      conditions.push({ assignedTo: user._id });
    } else if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      conditions.push({ assignedTo: new mongoose.Types.ObjectId(assignedTo) });
    }

    // Lead filter
    const targetLead = leadId || query.lead;
    if (targetLead && mongoose.Types.ObjectId.isValid(targetLead)) {
      conditions.push({ lead: new mongoose.Types.ObjectId(targetLead) });
    }

    // Priority filter
    if (priority && ['Low', 'Medium', 'High'].includes(priority)) {
      conditions.push({ priority });
    }

    // Date & Timeframe handling
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (overdue === 'true' || status === 'Overdue' || timeframe === 'overdue') {
      conditions.push({
        $or: [
          { status: 'Overdue' },
          {
            scheduledDate: { $lt: now },
            status: { $nin: ['Completed', 'Cancelled'] }
          }
        ]
      });
    } else if (timeframe === 'today') {
      conditions.push({
        scheduledDate: { $gte: startOfToday, $lte: endOfToday }
      });
      if (status && status !== 'All') {
        conditions.push({ status });
      } else {
        conditions.push({ status: { $ne: 'Cancelled' } });
      }
    } else if (timeframe === 'upcoming') {
      conditions.push({
        scheduledDate: { $gt: endOfToday }
      });
      if (status && status !== 'All') {
        conditions.push({ status });
      } else {
        conditions.push({ status: { $in: ['Pending', 'Rescheduled'] } });
      }
    } else if (timeframe === 'completed' || status === 'Completed') {
      conditions.push({ status: 'Completed' });
    } else if (status && status !== 'All') {
      conditions.push({ status });
    }

    // Specific date or date range filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push({ scheduledDate: { $gte: startOfDay, $lte: endOfDay } });
    } else if (startDate || endDate) {
      const dateRange = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateRange.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateRange.$lte = e;
      }
      conditions.push({ scheduledDate: dateRange });
    }

    // Search filter across Lead name, phone, email, notes, outcome
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingLeads = await Lead.find({
        $or: [
          { leadName: searchRegex },
          { phone: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');

      const leadIds = matchingLeads.map((l) => l._id);
      conditions.push({
        $or: [
          { notes: searchRegex },
          { outcome: searchRegex },
          { lead: { $in: leadIds } }
        ]
      });
    }

    if (conditions.length === 1) {
      Object.assign(filter, conditions[0]);
    } else if (conditions.length > 1) {
      filter.$and = conditions;
    }

    let sort = { scheduledDate: 1 };
    if (sortBy === 'scheduledDate_desc') sort = { scheduledDate: -1 };
    if (sortBy === 'createdAt_desc') sort = { createdAt: -1 };
    if (sortBy === 'priority_desc') sort = { priority: -1, scheduledDate: 1 };

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, parseInt(limit) || 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('lead', 'leadName phone email status temperature preferredPropertyType city customer')
        .populate('assignedTo', 'name email role phone department')
        .sort(sort)
        .skip(skip)
        .limit(parsedLimit),
      FollowUp.countDocuments(filter)
    ]);

    return {
      followUps,
      pagination: {
        total,
        totalRecords: total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1
      }
    };
  }

  static async getFollowUpById(id, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid follow-up ID');
    }
    const followUp = await FollowUp.findById(id)
      .populate('lead', 'leadName phone email status temperature preferredPropertyType city customer')
      .populate('assignedTo', 'name email role phone department');

    if (!followUp) {
      throw new Error('Follow-up not found');
    }

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      const assignedId = followUp.assignedTo?._id || followUp.assignedTo;
      if (assignedId && assignedId.toString() !== user._id.toString()) {
        throw new Error('You are not authorized to view this follow-up');
      }
    }

    return followUp;
  }

  static async createFollowUp(data, user) {
    const { leadId, scheduledDate, notes, priority, assignedTo } = data;
    if (!leadId) throw new Error('Lead is required');
    if (!mongoose.Types.ObjectId.isValid(leadId)) throw new Error('Invalid Lead ID');

    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    if (!scheduledDate) throw new Error('Scheduled date and time are required');
    const scheduled = new Date(scheduledDate);
    if (isNaN(scheduled.getTime())) {
      throw new Error('Please provide a valid scheduled date and time');
    }

    let assignee = user._id;
    if (assignedTo && ['super_admin', 'superadmin', 'admin', 'sales_manager'].includes(user.role)) {
      if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        assignee = new mongoose.Types.ObjectId(assignedTo);
      }
    } else if (lead.assignedTo) {
      assignee = lead.assignedTo;
    }

    const followUp = await FollowUp.create({
      lead: lead._id,
      assignedTo: assignee,
      scheduledDate: scheduled,
      notes: notes ? String(notes).trim() : '',
      priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
      status: 'Pending'
    });

    lead.nextFollowUpDate = scheduled;
    await lead.save();

    if (assignee.toString() !== user._id.toString()) {
      try {
        await Notification.create({
          recipient: assignee,
          title: 'New Follow-Up Scheduled',
          message: `Follow-up scheduled with ${lead.leadName} for ${scheduled.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`,
          type: 'followup',
          link: '/followups'
        });
      } catch (_) {}
    }

    return FollowUp.findById(followUp._id)
      .populate('lead', 'leadName phone email status temperature preferredPropertyType city customer')
      .populate('assignedTo', 'name email role phone department');
  }

  static async updateFollowUp(id, data, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid follow-up ID');
    }
    const followUp = await FollowUp.findById(id);
    if (!followUp) throw new Error('Follow-up not found');

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      if (followUp.assignedTo && followUp.assignedTo.toString() !== user._id.toString()) {
        throw new Error('You are not authorized to modify this follow-up');
      }
    }

    const lead = await Lead.findById(followUp.lead);

    // If marked completed
    if (data.status === 'Completed') {
      followUp.status = 'Completed';
      followUp.completedAt = new Date();
      if (data.outcome || data.outcomeNotes) {
        followUp.outcome = String(data.outcome || data.outcomeNotes).trim();
      }
      if (data.notes) {
        followUp.notes = String(data.notes).trim();
      }

      if (lead) {
        const nextPending = await FollowUp.findOne({
          lead: lead._id,
          _id: { $ne: followUp._id },
          status: { $in: ['Pending', 'Rescheduled'] },
          scheduledDate: { $gte: new Date() }
        }).sort({ scheduledDate: 1 });

        lead.nextFollowUpDate = nextPending ? nextPending.scheduledDate : null;
        await lead.save();
      }
    }
    // If rescheduled
    else if (data.status === 'Rescheduled' || (data.scheduledDate && data.status !== 'Completed')) {
      if (data.scheduledDate) {
        const newDate = new Date(data.scheduledDate);
        if (isNaN(newDate.getTime())) {
          throw new Error('Please provide a valid reschedule date and time');
        }
        followUp.scheduledDate = newDate;
        if (lead) {
          lead.nextFollowUpDate = newDate;
          await lead.save();
        }
      }
      followUp.status = data.status || 'Rescheduled';
      if (data.notes) followUp.notes = String(data.notes).trim();
      if (data.outcome || data.outcomeNotes) followUp.outcome = String(data.outcome || data.outcomeNotes).trim();
      if (data.priority) followUp.priority = data.priority;
    }
    // If cancelled
    else if (data.status === 'Cancelled') {
      followUp.status = 'Cancelled';
      if (data.notes) followUp.notes = String(data.notes).trim();
      if (data.outcome || data.outcomeNotes) followUp.outcome = String(data.outcome || data.outcomeNotes).trim();

      if (lead) {
        const nextPending = await FollowUp.findOne({
          lead: lead._id,
          _id: { $ne: followUp._id },
          status: { $in: ['Pending', 'Rescheduled'] },
          scheduledDate: { $gte: new Date() }
        }).sort({ scheduledDate: 1 });

        lead.nextFollowUpDate = nextPending ? nextPending.scheduledDate : null;
        await lead.save();
      }
    }
    // General update
    else {
      if (data.status) followUp.status = data.status;
      if (data.priority) followUp.priority = data.priority;
      if (data.notes !== undefined) followUp.notes = String(data.notes).trim();
      if (data.outcome !== undefined) followUp.outcome = String(data.outcome).trim();
      if (data.assignedTo && ['super_admin', 'superadmin', 'admin', 'sales_manager'].includes(user.role)) {
        if (mongoose.Types.ObjectId.isValid(data.assignedTo)) {
          followUp.assignedTo = data.assignedTo;
        }
      }
    }

    await followUp.save();

    return FollowUp.findById(followUp._id)
      .populate('lead', 'leadName phone email status temperature preferredPropertyType city customer')
      .populate('assignedTo', 'name email role phone department');
  }

  static async deleteFollowUp(id, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid follow-up ID');
    }
    const followUp = await FollowUp.findById(id);
    if (!followUp) throw new Error('Follow-up not found');

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      if (followUp.assignedTo && followUp.assignedTo.toString() !== user._id.toString()) {
        throw new Error('You are not authorized to delete this follow-up');
      }
    }

    await FollowUp.findByIdAndDelete(id);

    const lead = await Lead.findById(followUp.lead);
    if (lead) {
      const nextPending = await FollowUp.findOne({
        lead: lead._id,
        status: { $in: ['Pending', 'Rescheduled'] },
        scheduledDate: { $gte: new Date() }
      }).sort({ scheduledDate: 1 });

      lead.nextFollowUpDate = nextPending ? nextPending.scheduledDate : null;
      await lead.save();
    }

    return { message: 'Follow-up removed successfully' };
  }

  static async getTelecallerCallingQueue(user) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const pendingFollowUps = await FollowUp.find({
      assignedTo: user._id,
      status: { $in: ['Pending', 'Overdue', 'Rescheduled'] },
      scheduledDate: { $lte: today }
    }).populate('lead', 'leadName phone status temperature preferredPropertyType');

    const freshLeads = await Lead.find({
      assignedTo: user._id,
      status: { $in: ['New', 'Contacted', 'Follow Up'] }
    }).sort({ createdAt: -1 }).limit(20);

    return {
      pendingFollowUps,
      freshLeads
    };
  }
}
