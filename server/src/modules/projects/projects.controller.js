import { ProjectsService } from './projects.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getProjects = async (req, res) => {
  try {
    const result = await ProjectsService.getProjects(req.query);
    return sendSuccess(res, 'Projects retrieved successfully', result.projects, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createProject = async (req, res) => {
  try {
    const project = await ProjectsService.createProject(req.body, req.user);
    return sendSuccess(res, 'Project created successfully', project, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getProjectById = async (req, res) => {
  try {
    const result = await ProjectsService.getProjectById(req.params.id);
    return sendSuccess(res, 'Project retrieved successfully', result);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await ProjectsService.updateProject(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Project updated successfully', project);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
