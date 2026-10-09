import { EmployeesService } from './employees.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getUsers = async (req, res) => {
  try {
    const result = await EmployeesService.getUsers(req.query);
    return sendSuccess(res, 'Users retrieved successfully', result.users, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await EmployeesService.createUser(req.body, req.user);
    return sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await EmployeesService.updateUser(req.params.id, req.body, req.user);
    return sendSuccess(res, 'User updated successfully', user);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getUserWorkload = async (req, res) => {
  try {
    const workload = await EmployeesService.getUserWorkload(req.params.id);
    return sendSuccess(res, 'User workload metrics retrieved', workload);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
