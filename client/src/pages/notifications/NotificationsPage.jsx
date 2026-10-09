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
          <h1 className="text-xl font-bold text-[#F8FAFC]">System Notifications & Operational Alerts</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Stay informed about lead assignments, callbacks, bookings, and payment status</p>
        </div>
        <Button variant="secondary" icon={CheckCheck} onClick={handleMarkAllRead}>
          Mark All As Read
        </Button>
      </div>

      <Card title="Activity & Notification Queue">
        {loading ? (
          <Spinner size="lg" />
        ) : notifications.length === 0 ? (
          <p className="text-xs text-[#94A3B8] text-center py-12">No notifications found in your queue</p>
        ) : (
          <div className="divide-y divide-[#334155]">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`py-4 px-3 flex items-start justify-between gap-4 rounded-xl transition-colors ${
                  !item.isRead ? 'bg-[#4C2A8A]/20 border border-[#6D28D9]/30' : 'hover:bg-[#243249]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${!item.isRead ? 'bg-[#6D28D9] text-white' : 'bg-[#243249] text-[#94A3B8]'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#F8FAFC]">{item.title}</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{item.message}</p>
                    <span className="text-[11px] text-[#64748B] flex items-center gap-1 mt-1.5">
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
