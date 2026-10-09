import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';
import { Building, ShieldCheck, LogOut } from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, hasRole } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter((item) => hasRole(...item.roles));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-[#121924] border-r border-slate-800 text-slate-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-[#0b0f16]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#442d82] to-[#b7d333] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
          <Building className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">KODBRAND</h1>
            <p className="text-[10px] text-[#b7d333] font-semibold tracking-wider uppercase">Real Estate ERP</p>
          </div>
        )}
      </div>

      {/* Navigation Scroll */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#442d82] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#0b0f16]">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2 py-1'}`}>
          <div className="w-9 h-9 rounded-full bg-[#442d82] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'KB'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 capitalize">
                <ShieldCheck className="w-3 h-3 text-[#b7d333]" />
                <span className="truncate">{user?.role?.replace('_', ' ') || 'Staff'}</span>
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
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
