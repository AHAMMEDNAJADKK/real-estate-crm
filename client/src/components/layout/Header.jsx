import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/dashboardService';
import {
  Menu,
  Bell,
  User,
  LogOut,
  CheckCheck,
  Search,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';

export const Header = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (res.success) {
          setNotifications(res.data || []);
          setUnreadCount(res.meta?.unreadCount || 0);
        }
      } catch (err) {
        // Quiet fallback
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentNav = NAV_ITEMS.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  return (
    <header className="h-16 bg-[#1E2B40] border-b border-[#334155] sticky top-0 z-30 px-6 flex items-center justify-between shadow-md">
      {/* Left side: Hamburger toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243249] rounded-xl transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Display */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#94A3B8]">
          <Link to="/" className="hover:text-[#F8FAFC] font-semibold transition-colors">
            KODBRAND CRM
          </Link>
          <ChevronRight size={14} className="text-[#475569]" />
          <span className="font-bold text-[#F8FAFC]">
            {currentNav?.title || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="hidden md:flex items-center max-w-xs w-full mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search leads, bookings, units..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-[#243249] border border-[#334155] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] transition-all"
          />
        </div>
      </div>

      {/* Right side: Status indicator, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Live System Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#243249] border border-[#334155] text-[11px] font-semibold text-[#84CC16]">
          <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
          <span>Live Operations</span>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243249] rounded-xl transition-colors cursor-pointer"
            title="System Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1E2B40] rounded-2xl shadow-2xl border border-[#334155] p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
                <span className="text-sm font-bold text-[#F8FAFC]">
                  Alerts & Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#334155] mt-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-6">No pending notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id || n.id}
                      className={`py-2.5 px-2 rounded-xl transition-colors ${
                        !n.isRead ? 'bg-[#243249]/80' : ''
                      }`}
                    >
                      <p className="text-xs font-bold text-[#F8FAFC]">{n.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[#64748B] mt-1 block font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <Link
                to="/notifications"
                onClick={() => setShowNotifications(false)}
                className="mt-3 block text-center text-xs font-bold text-[#8B5CF6] hover:underline pt-2 border-t border-[#334155]"
              >
                View all notifications &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* User Mini Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#334155]">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#F8FAFC]">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-[#A78BFA] font-semibold uppercase tracking-wider">
              {user?.role?.replace('_', ' ') || 'Staff'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#243249] rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
