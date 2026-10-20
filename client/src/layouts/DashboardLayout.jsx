import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/EmptyState';

export const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#182437] text-slate-800 dark:text-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#182437] text-slate-900 dark:text-[#F8FAFC] flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0 bg-slate-50 dark:bg-[#182437] transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
