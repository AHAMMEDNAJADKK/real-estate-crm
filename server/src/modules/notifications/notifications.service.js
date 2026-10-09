import Notification from '../../models/Notification.js';

export class NotificationsService {
  static async getNotifications(user) {
    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: user._id, isRead: false });

    return { notifications, unreadCount };
  }

  static async markAsRead(id, user) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: user._id },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  static async markAllAsRead(user) {
    await Notification.updateMany({ recipient: user._id, isRead: false }, { isRead: true });
    return true;
  }
}
