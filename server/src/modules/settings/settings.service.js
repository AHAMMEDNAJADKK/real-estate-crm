import AuditLog from '../../models/AuditLog.js';
import { LEAD_STATUSES, LEAD_TEMPERATURES } from '../../models/Lead.js';
import { USER_ROLES } from '../../models/User.js';

let systemSettings = {
  companyName: 'KODBRAND Realty & Infrastructure Ltd.',
  currency: 'INR',
  currencySymbol: '₹',
  fiscalYearStart: 'April',
  standardCommissionPercentage: 1.0,
  reservationExpiryHours: 72,
  leadSources: ['Website', 'Meta Ads', 'Google Ads', 'Broker Network', 'Walk-in', 'Referral', 'Newspaper / Print', 'Cold Call'],
  leadStatuses: LEAD_STATUSES,
  leadTemperatures: LEAD_TEMPERATURES,
  propertyTypes: ['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Villa', 'Commercial', 'Plot'],
  userRoles: USER_ROLES
};

export class SettingsService {
  static getSettings() {
    return systemSettings;
  }

  static updateSettings(newSettings, user) {
    systemSettings = { ...systemSettings, ...newSettings };
    AuditLog.create({
      user: user._id,
      action: 'SETTINGS_UPDATED',
      entity: 'SystemSettings',
      details: newSettings
    }).catch(err => console.error(err));
    return systemSettings;
  }

  static async getAuditLogs(query = {}) {
    const { page = 1, limit = 50, entity, action } = query;
    const filter = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);

    return {
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }
}
