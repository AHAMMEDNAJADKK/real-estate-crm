import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldCheck, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, hasRole } = useAuth();

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-[#1E2B40] border-r border-[#334155] text-[#94A3B8] flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#334155] bg-[#1A2537]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-[#6D28D9]/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-[#F8FAFC] text-base leading-tight tracking-tight">
                KODBRAND
              </h1>
              <p className="text-[10px] text-[#A78BFA] font-bold tracking-widest uppercase">
                Real Estate CRM
              </p>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243249] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => hasRole(...item.roles));
          if (!visibleItems.length) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3.5 text-[10px] font-extrabold tracking-widest text-[#64748B] uppercase mb-1">
                  {section.title}
                </h4>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-[#4C2A8A] text-[#F8FAFC] font-semibold shadow-md shadow-[#4C2A8A]/30 border-l-4 border-[#8B5CF6]'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243249]'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`
                    }
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#334155] bg-[#1A2537]">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2 py-1'}`}>
          <div className="w-9 h-9 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'KB'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-[#F8FAFC] truncate">
                {user?.name || 'Administrator'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] capitalize">
                <ShieldCheck className="w-3 h-3 text-[#84CC16]" />
                <span className="truncate">{user?.role?.replace('_', ' ') || 'Staff'}</span>
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] rounded-lg hover:bg-[#243249] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
