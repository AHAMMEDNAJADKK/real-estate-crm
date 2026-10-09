import { SiteVisitsService } from './site-visits.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getSiteVisits = async (req, res) => {
  try {
    const result = await SiteVisitsService.getSiteVisits(req.query, req.user);
    return sendSuccess(res, 'Site visits retrieved successfully', result.siteVisits, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createSiteVisit = async (req, res) => {
  try {
    const visit = await SiteVisitsService.createSiteVisit(req.body, req.user);
    return sendSuccess(res, 'Site visit scheduled successfully', visit, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateSiteVisit = async (req, res) => {
  try {
    const visit = await SiteVisitsService.updateSiteVisit(req.params.id, req.body);
    return sendSuccess(res, 'Site visit updated successfully', visit);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
