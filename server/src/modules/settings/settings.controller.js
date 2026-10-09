import { SettingsService } from './settings.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getSettings = (req, res) => {
  const settings = SettingsService.getSettings();
  return sendSuccess(res, 'System settings retrieved', settings);
};

export const updateSettings = (req, res) => {
  try {
    const updated = SettingsService.updateSettings(req.body, req.user);
    return sendSuccess(res, 'System settings updated successfully', updated);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const result = await SettingsService.getAuditLogs(req.query);
    return sendSuccess(res, 'Audit logs retrieved successfully', result.logs, 200, result.pagination);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const handleFileUpload = (req, res) => {
  if (!req.file) {
    return sendError(res, 'No file was uploaded', 400);
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return sendSuccess(res, 'File uploaded successfully', {
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  }, 201);
};
