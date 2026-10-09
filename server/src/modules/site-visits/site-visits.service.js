import SiteVisit from '../../models/SiteVisit.js';
import Notification from '../../models/Notification.js';

export class SiteVisitsService {
  static async getSiteVisits(query = {}, user) {
    const { page = 1, limit = 20, status, date, project } = query;
    const filter = {};

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      filter.assignedExecutive = user._id;
    }

    if (status) filter.status = status;
    if (project) filter.project = project;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.visitDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [siteVisits, total] = await Promise.all([
      SiteVisit.find(filter)
        .populate('assignedExecutive', 'name email role')
        .populate('lead', 'leadName phone status')
        .populate('customer', 'name phone email')
        .populate('project', 'name code location')
        .populate('property', 'unitNumber propertyType')
        .sort({ visitDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SiteVisit.countDocuments(filter)
    ]);

    return {
      siteVisits,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createSiteVisit(data, user) {
    const siteVisit = new SiteVisit({
      ...data,
      assignedExecutive: data.assignedExecutive || user._id
    });
    await siteVisit.save();

    if (siteVisit.assignedExecutive.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: siteVisit.assignedExecutive,
        title: 'New Site Visit Assigned',
        message: `Property site visit scheduled for ${new Date(siteVisit.visitDate).toLocaleDateString()} at ${siteVisit.visitTime}`,
        type: 'site_visit',
        link: '/site-visits'
      });
    }

    return siteVisit;
  }

  static async updateSiteVisit(id, data) {
    const visit = await SiteVisit.findById(id);
    if (!visit) throw new Error('Site visit not found');

    Object.assign(visit, data);
    await visit.save();
    return visit;
  }
}
