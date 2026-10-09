import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Spinner } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      toast.error('Failed to mark notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Notifications & Operational Alerts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Stay informed about lead assignments, callbacks, bookings, and payment status</p>
        </div>
        <Button variant="secondary" icon={CheckCheck} onClick={handleMarkAllRead}>
          Mark All As Read
        </Button>
      </div>

      <Card title="Activity & Notification Queue">
        {loading ? (
          <Spinner size="lg" />
        ) : notifications.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-12">No notifications found in your queue</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`py-4 px-2 flex items-start justify-between gap-4 rounded-xl transition-colors ${
                  !item.isRead ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${!item.isRead ? 'bg-[#442d82] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.link && (
                    <Link to={item.link}>
                      <Button size="sm" variant="ghost">
                        View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                  {!item.isRead && (
                    <Button size="sm" variant="secondary" onClick={() => handleMarkRead(item._id)}>
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
