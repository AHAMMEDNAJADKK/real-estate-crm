import Lead from '../../models/Lead.js';
import CallLog from '../../models/CallLog.js';
import FollowUp from '../../models/FollowUp.js';
import Notification from '../../models/Notification.js';
import AuditLog from '../../models/AuditLog.js';
import Customer from '../../models/Customer.js';

export class LeadsService {
  static async getLeads(query = {}, user) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      temperature,
      source,
      assignedTo,
      project,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filter = {};

    // Role-based scoping: telecallers and sales executives see assigned leads unless managers/admins
    if (['telecaller', 'sales_executive'].includes(user.role)) {
      filter.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (temperature) filter.temperature = temperature;
    if (source) filter.source = source;
    if (project) filter.interestedProject = project;

    if (search) {
      filter.$or = [
        { leadName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email role department')
        .populate('interestedProject', 'name code')
        .populate('interestedProperty', 'unitNumber propertyType listedPrice')
        .populate('customer', 'name phone email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Lead.countDocuments(filter)
    ]);

    return {
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  static async createLead(data, creatorUser) {
    // Duplicate detection by phone number
    const existing = await Lead.findOne({ phone: data.phone.trim() });
    if (existing) {
      throw new Error(`A lead with phone number ${data.phone} already exists (${existing.leadName} - ${existing.status})`);
    }

    const lead = new Lead({
      ...data,
      createdBy: creatorUser._id,
      assignedTo: data.assignedTo || creatorUser._id
    });

    await lead.save();

    await AuditLog.create({
      user: creatorUser._id,
      action: 'LEAD_CREATED',
      entity: 'Lead',
      entityId: lead._id.toString(),
      details: { leadName: lead.leadName, phone: lead.phone, status: lead.status }
    });

    // Notify assigned user if different from creator
    if (lead.assignedTo && lead.assignedTo.toString() !== creatorUser._id.toString()) {
      await Notification.create({
        recipient: lead.assignedTo,
        title: 'New Lead Assigned',
        message: `You have been assigned new lead: ${lead.leadName} (${lead.phone})`,
        type: 'assignment',
        link: `/leads/${lead._id}`
      });
    }

    return lead;
  }

  static async getLeadById(id) {
    const lead = await Lead.findById(id)
      .populate('assignedTo', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('interestedProject', 'name code location developer')
      .populate('interestedProperty', 'unitNumber propertyType listedPrice status')
      .populate('customer', 'name phone email address customerType');

    if (!lead) throw new Error('Lead not found');
    return lead;
  }

  static async updateLead(id, data, user) {
    const lead = await Lead.findById(id);
    if (!lead) throw new Error('Lead not found');

    const previousStatus = lead.status;
    const previousAssignedTo = lead.assignedTo;

    Object.assign(lead, data);

    // If marked converted, update convertedAt timestamp and link/create customer
    if (data.status === 'Converted' && previousStatus !== 'Converted') {
      lead.convertedAt = new Date();
      if (!lead.customer) {
        let cust = await Customer.findOne({ phone: lead.phone });
        if (!cust) {
          cust = await Customer.create({
            name: lead.leadName,
            email: lead.email,
            phone: lead.phone,
            originatingLead: lead._id,
            assignedAgent: lead.assignedTo || user._id,
            status: 'Lead Qualified',
            preferences: {
              propertyType: lead.preferredPropertyType,
              budgetMin: lead.budgetMin,
              budgetMax: lead.budgetMax,
              preferredLocation: lead.preferredLocation
            }
          });
        }
        lead.customer = cust._id;
      }
    }

    await lead.save();

    await AuditLog.create({
      user: user._id,
      action: 'LEAD_UPDATED',
      entity: 'Lead',
      entityId: lead._id.toString(),
      details: { previousStatus, newStatus: lead.status, changes: Object.keys(data) }
    });

    return lead;
  }

  static async assignLead(id, newAssignedToId, managerUser) {
    const lead = await Lead.findById(id);
    if (!lead) throw new Error('Lead not found');

    const oldAssignee = lead.assignedTo;
    lead.assignedTo = newAssignedToId;
    await lead.save();

    await AuditLog.create({
      user: managerUser._id,
      action: 'LEAD_REASSIGNED',
      entity: 'Lead',
      entityId: lead._id.toString(),
      details: { from: oldAssignee, to: newAssignedToId }
    });

    await Notification.create({
      recipient: newAssignedToId,
      title: 'Lead Reassigned',
      message: `Lead ${lead.leadName} (${lead.phone}) has been assigned to you.`,
      type: 'assignment',
      link: `/leads/${lead._id}`
    });

    return lead;
  }

  static async getLeadHistory(id) {
    const [callLogs, followUps, auditLogs] = await Promise.all([
      CallLog.find({ lead: id }).populate('telecaller', 'name email').sort({ createdAt: -1 }),
      FollowUp.find({ lead: id }).populate('assignedTo', 'name email').sort({ scheduledDate: -1 }),
      AuditLog.find({ entity: 'Lead', entityId: id.toString() }).populate('user', 'name role').sort({ createdAt: -1 })
    ]);

    return { callLogs, followUps, auditLogs };
  }

  static async importLeads(leadsData = [], user) {
    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const item of leadsData) {
      try {
        if (!item.leadName || !item.phone) {
          skipped++;
          continue;
        }

        const phone = String(item.phone).trim();
        const existing = await Lead.findOne({ phone });
        if (existing) {
          skipped++;
          continue;
        }

        await Lead.create({
          leadName: item.leadName.trim(),
          phone,
          email: item.email ? String(item.email).trim() : '',
          city: item.city ? String(item.city).trim() : '',
          source: item.source || 'Bulk Import',
          budgetMin: Number(item.budgetMin) || 0,
          budgetMax: Number(item.budgetMax) || 0,
          preferredLocation: item.preferredLocation || '',
          preferredPropertyType: item.preferredPropertyType || 'Apartment',
          temperature: item.temperature || 'Warm',
          status: 'New',
          createdBy: user._id,
          assignedTo: item.assignedTo || user._id
        });
        created++;
      } catch (err) {
        errors.push({ lead: item.leadName, error: err.message });
      }
    }

    return { created, skipped, errorsCount: errors.length, errors };
  }
}
