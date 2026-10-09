import { NotificationsService } from './notifications.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getNotifications = async (req, res) => {
  try {
    const result = await NotificationsService.getNotifications(req.user);
    return sendSuccess(res, 'Notifications retrieved successfully', result.notifications, 200, { unreadCount: result.unreadCount });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await NotificationsService.markAsRead(req.params.id, req.user);
    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await NotificationsService.markAllAsRead(req.user);
    return sendSuccess(res, 'All notifications marked as read', null);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
