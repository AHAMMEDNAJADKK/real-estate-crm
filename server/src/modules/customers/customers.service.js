import Customer from '../../models/Customer.js';
import Lead from '../../models/Lead.js';
import CallLog from '../../models/CallLog.js';
import Meeting from '../../models/Meeting.js';
import SiteVisit from '../../models/SiteVisit.js';
import Opportunity from '../../models/Opportunity.js';
import Booking from '../../models/Booking.js';
import AuditLog from '../../models/AuditLog.js';

export class CustomersService {
  static async getCustomers(query = {}, user) {
    const { page = 1, limit = 20, search, status, customerType, agent } = query;
    const filter = {};

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      filter.assignedAgent = user._id;
    } else if (agent) {
      filter.assignedAgent = agent;
    }

    if (status) filter.status = status;
    if (customerType) filter.customerType = customerType;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('assignedAgent', 'name email role department')
        .populate('shortlistedProperties.property', 'unitNumber propertyType listedPrice')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Customer.countDocuments(filter)
    ]);

    return {
      customers,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createCustomer(data, user) {
    const existing = await Customer.findOne({ phone: data.phone.trim() });
    if (existing) {
      throw new Error(`Customer with phone ${data.phone} already exists (${existing.name})`);
    }

    const customer = new Customer({
      ...data,
      assignedAgent: data.assignedAgent || user._id
    });
    await customer.save();

    await AuditLog.create({
      user: user._id,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone }
    });

    return customer;
  }

  static async getCustomer360(id) {
    const customer = await Customer.findById(id)
      .populate('assignedAgent', 'name email phone role')
      .populate('shortlistedProperties.property');

    if (!customer) throw new Error('Customer not found');

    // Fetch complete 360-degree timeline
    const [leads, meetings, siteVisits, opportunities, bookings] = await Promise.all([
      Lead.find({ $or: [{ customer: id }, { phone: customer.phone }] }).sort({ createdAt: -1 }),
      Meeting.find({ customer: id }).populate('assignedEmployee', 'name').sort({ scheduledDate: -1 }),
      SiteVisit.find({ customer: id }).populate('project', 'name').populate('assignedExecutive', 'name').sort({ visitDate: -1 }),
      Opportunity.find({ customer: id }).populate('project', 'name').populate('property', 'unitNumber').sort({ createdAt: -1 }),
      Booking.find({ customer: id }).populate('property', 'unitNumber propertyType').populate('project', 'name').sort({ createdAt: -1 })
    ]);

    const leadIds = leads.map(l => l._id);
    const callLogs = await CallLog.find({ lead: { $in: leadIds } })
      .populate('telecaller', 'name')
      .sort({ createdAt: -1 });

    return {
      customer,
      interactions: {
        leads,
        callLogs,
        meetings,
        siteVisits,
        opportunities,
        bookings
      }
    };
  }

  static async updateCustomer(id, data, user) {
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
    if (!customer) throw new Error('Customer not found');

    await AuditLog.create({
      user: user._id,
      action: 'CUSTOMER_UPDATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      details: { changes: Object.keys(data) }
    });

    return customer;
  }
}
