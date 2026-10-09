import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import LeadsPage from '../pages/leads/LeadsPage';
import TelecallersPage from '../pages/telecallers/TelecallersPage';
import FollowUpsPage from '../pages/followups/FollowUpsPage';
import MeetingsPage from '../pages/meetings/MeetingsPage';
import SiteVisitsPage from '../pages/site-visits/SiteVisitsPage';
import ProjectsPage from '../pages/projects/ProjectsPage';
import PropertiesPage from '../pages/properties/PropertiesPage';
import CustomersPage from '../pages/customers/CustomersPage';
import OpportunitiesPage from '../pages/opportunities/OpportunitiesPage';
import BookingsPage from '../pages/bookings/BookingsPage';
import PaymentsPage from '../pages/payments/PaymentsPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import CommissionsPage from '../pages/commissions/CommissionsPage';
import AccountsPage from '../pages/accounts/AccountsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import SettingsPage from '../pages/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'telecallers', element: <TelecallersPage /> },
      { path: 'followups', element: <FollowUpsPage /> },
      { path: 'meetings', element: <MeetingsPage /> },
      { path: 'site-visits', element: <SiteVisitsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'properties', element: <PropertiesPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'opportunities', element: <OpportunitiesPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'commissions', element: <CommissionsPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

export default router;
