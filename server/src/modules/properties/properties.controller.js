import { PropertiesService } from './properties.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getProperties = async (req, res) => {
  try {
    const result = await PropertiesService.getProperties(req.query);
    return sendSuccess(res, 'Properties retrieved successfully', result.properties, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createProperty = async (req, res) => {
  try {
    const property = await PropertiesService.createProperty(req.body, req.user);
    return sendSuccess(res, 'Property unit created successfully', property, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const property = await PropertiesService.getPropertyById(req.params.id);
    return sendSuccess(res, 'Property unit retrieved successfully', property);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const updateProperty = async (req, res) => {
  try {
    const property = await PropertiesService.updateProperty(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Property unit updated successfully', property);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
