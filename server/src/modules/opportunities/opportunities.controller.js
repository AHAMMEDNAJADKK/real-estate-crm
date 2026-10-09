import { OpportunitiesService } from './opportunities.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getOpportunities = async (req, res) => {
  try {
    const opportunities = await OpportunitiesService.getOpportunities(req.query, req.user);
    return sendSuccess(res, 'Opportunities retrieved successfully', opportunities);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const opportunity = await OpportunitiesService.createOpportunity(req.body, req.user);
    return sendSuccess(res, 'Opportunity created successfully', opportunity, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await OpportunitiesService.getOpportunityById(req.params.id);
    return sendSuccess(res, 'Opportunity retrieved successfully', opportunity);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await OpportunitiesService.updateOpportunity(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Opportunity updated successfully', opportunity);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
