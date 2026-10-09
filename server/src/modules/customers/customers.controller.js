import { CustomersService } from './customers.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getCustomers = async (req, res) => {
  try {
    const result = await CustomersService.getCustomers(req.query, req.user);
    return sendSuccess(res, 'Customers retrieved successfully', result.customers, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await CustomersService.createCustomer(req.body, req.user);
    return sendSuccess(res, 'Customer profile created successfully', customer, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getCustomer360 = async (req, res) => {
  try {
    const result = await CustomersService.getCustomer360(req.params.id);
    return sendSuccess(res, 'Customer 360 profile retrieved successfully', result);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await CustomersService.updateCustomer(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Customer profile updated successfully', customer);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
