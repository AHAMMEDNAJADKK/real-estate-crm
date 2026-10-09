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
    const { page = 1, limit = 20, status, date, overdue } = query;
    const filter = {};

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      filter.assignedTo = user._id;
    }

    if (status) filter.status = status;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (overdue === 'true') {
      filter.scheduledDate = { $lt: new Date() };
      filter.status = 'Pending';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('lead', 'leadName phone status temperature preferredPropertyType')
        .populate('assignedTo', 'name email')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FollowUp.countDocuments(filter)
    ]);

    return {
      followUps,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createFollowUp(data, user) {
    const { leadId, scheduledDate, notes, priority, assignedTo } = data;
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    const assignee = assignedTo || user._id;

    const followUp = await FollowUp.create({
      lead: lead._id,
      assignedTo: assignee,
      scheduledDate: new Date(scheduledDate),
      notes: notes || '',
      priority: priority || 'Medium',
      status: 'Pending'
    });

    lead.nextFollowUpDate = new Date(scheduledDate);
    await lead.save();

    if (assignee.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: assignee,
        title: 'New Follow-Up Scheduled',
        message: `Follow-up scheduled with ${lead.leadName} for ${new Date(scheduledDate).toLocaleString()}`,
        type: 'followup',
        link: `/followups`
      });
    }

    return followUp;
  }

  static async updateFollowUp(id, data, user) {
    const followUp = await FollowUp.findById(id);
    if (!followUp) throw new Error('Follow-up not found');

    if (data.status === 'Completed' && followUp.status !== 'Completed') {
      followUp.completedAt = new Date();
    }

    Object.assign(followUp, data);
    await followUp.save();

    return followUp;
  }

  static async getTelecallerCallingQueue(user) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const pendingFollowUps = await FollowUp.find({
      assignedTo: user._id,
      status: 'Pending',
      scheduledDate: { $lte: today }
    }).populate('lead');

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
