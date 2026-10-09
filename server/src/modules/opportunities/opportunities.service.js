import Opportunity from '../../models/Opportunity.js';
import AuditLog from '../../models/AuditLog.js';

export class OpportunitiesService {
  static async getOpportunities(query = {}, user) {
    const { stage, project, executive } = query;
    const filter = {};

    if (['sales_executive'].includes(user.role)) {
      filter.assignedSalesExecutive = user._id;
    } else if (executive) {
      filter.assignedSalesExecutive = executive;
    }

    if (stage) filter.stage = stage;
    if (project) filter.project = project;

    const opportunities = await Opportunity.find(filter)
      .populate('customer', 'name phone email customerType')
      .populate('project', 'name code location')
      .populate('property', 'unitNumber propertyType listedPrice')
      .populate('assignedSalesExecutive', 'name email role')
      .sort({ updatedAt: -1 });

    return opportunities;
  }

  static async createOpportunity(data, user) {
    const opportunity = new Opportunity({
      ...data,
      assignedSalesExecutive: data.assignedSalesExecutive || user._id
    });
    await opportunity.save();

    await AuditLog.create({
      user: user._id,
      action: 'OPPORTUNITY_CREATED',
      entity: 'Opportunity',
      entityId: opportunity._id.toString(),
      details: { title: opportunity.title, stage: opportunity.stage, expectedRevenue: opportunity.expectedRevenue }
    });

    return opportunity;
  }

  static async getOpportunityById(id) {
    const opp = await Opportunity.findById(id)
      .populate('customer', 'name phone email customerType address')
      .populate('project', 'name code location developer')
      .populate('property', 'unitNumber propertyType listedPrice status')
      .populate('assignedSalesExecutive', 'name email phone');

    if (!opp) throw new Error('Opportunity not found');
    return opp;
  }

  static async updateOpportunity(id, data, user) {
    const opp = await Opportunity.findById(id);
    if (!opp) throw new Error('Opportunity not found');

    const previousStage = opp.stage;
    Object.assign(opp, data);

    if (data.stage === 'Closed Won' && previousStage !== 'Closed Won') {
      opp.closedAt = new Date();
      opp.probability = 100;
    } else if (data.stage === 'Closed Lost' && previousStage !== 'Closed Lost') {
      opp.closedAt = new Date();
      opp.probability = 0;
    }

    await opp.save();

    await AuditLog.create({
      user: user._id,
      action: 'OPPORTUNITY_UPDATED',
      entity: 'Opportunity',
      entityId: opp._id.toString(),
      details: { previousStage, newStage: opp.stage, changes: Object.keys(data) }
    });

    return opp;
  }
}
