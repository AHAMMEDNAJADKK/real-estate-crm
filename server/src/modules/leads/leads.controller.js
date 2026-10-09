import { LeadsService } from './leads.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getLeads = async (req, res) => {
  try {
    const result = await LeadsService.getLeads(req.query, req.user);
    return sendSuccess(res, 'Leads fetched successfully', result.leads, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createLead = async (req, res) => {
  try {
    const lead = await LeadsService.createLead(req.body, req.user);
    return sendSuccess(res, 'Lead created successfully', lead, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getLeadById = async (req, res) => {
  try {
    const lead = await LeadsService.getLeadById(req.params.id);
    return sendSuccess(res, 'Lead retrieved successfully', lead);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const updateLead = async (req, res) => {
  try {
    const lead = await LeadsService.updateLead(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Lead updated successfully', lead);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) return sendError(res, 'assignedTo user ID is required', 400);
    const lead = await LeadsService.assignLead(req.params.id, assignedTo, req.user);
    return sendSuccess(res, 'Lead assigned successfully', lead);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const { status, temperature, remarks } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (temperature) updateData.temperature = temperature;
    if (remarks) updateData.remarks = remarks;

    const lead = await LeadsService.updateLead(req.params.id, updateData, req.user);
    return sendSuccess(res, 'Lead status updated successfully', lead);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getLeadHistory = async (req, res) => {
  try {
    const history = await LeadsService.getLeadHistory(req.params.id);
    return sendSuccess(res, 'Lead history retrieved successfully', history);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const importLeads = async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return sendError(res, 'An array of leads is required for import', 400);
    }
    const result = await LeadsService.importLeads(leads, req.user);
    return sendSuccess(res, 'Leads import completed', result);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const exportLeads = async (req, res) => {
  try {
    const result = await LeadsService.getLeads({ ...req.query, limit: 5000 }, req.user);
    return sendSuccess(res, 'Leads exported successfully', result.leads);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
