import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import leadRoutes from '../modules/leads/leads.routes.js';
import telecallerRoutes from '../modules/telecallers/telecallers.routes.js';
import meetingRoutes from '../modules/meetings/meetings.routes.js';
import siteVisitRoutes from '../modules/site-visits/site-visits.routes.js';
import projectRoutes from '../modules/projects/projects.routes.js';
import propertyRoutes from '../modules/properties/properties.routes.js';
import customerRoutes from '../modules/customers/customers.routes.js';
import opportunityRoutes from '../modules/opportunities/opportunities.routes.js';
import bookingRoutes from '../modules/bookings/bookings.routes.js';
import paymentRoutes from '../modules/payments/payments.routes.js';
import employeeRoutes from '../modules/employees/employees.routes.js';
import commissionRoutes from '../modules/commissions/commissions.routes.js';
import accountRoutes from '../modules/accounts/accounts.routes.js';
import reportRoutes from '../modules/reports/reports.routes.js';
import notificationRoutes from '../modules/notifications/notifications.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';

// Dedicated controller imports for top-level direct REST mapping
import { getCallLogs, recordCallLog, getFollowUps, createFollowUp, updateFollowUp } from '../modules/telecallers/telecallers.controller.js';
import { getAuditLogs } from '../modules/settings/settings.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Module Route Registrations
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/leads', leadRoutes);
router.use('/telecallers', telecallerRoutes);
router.use('/meetings', meetingRoutes);
router.use('/site-visits', siteVisitRoutes);
router.use('/projects', projectRoutes);
router.use('/properties', propertyRoutes);
router.use('/customers', customerRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', employeeRoutes);
router.use('/commissions', commissionRoutes);
router.use('/accounts', accountRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);

// Direct top-level aliases requested in Prompt & PDF specification
router.use('/leads-telecaller', telecallerRoutes);
router.use('/performance-dashboard', dashboardRoutes);
router.get('/call-logs', authenticate, getCallLogs);
router.post('/call-logs', authenticate, validateRequest(['leadId', 'callOutcome']), recordCallLog);
router.get('/follow-ups', authenticate, getFollowUps);
router.post('/follow-ups', authenticate, validateRequest(['leadId', 'scheduledDate']), createFollowUp);
router.patch('/follow-ups/:id', authenticate, updateFollowUp);
router.get('/audit-logs', authenticate, authorize('super_admin', 'admin'), getAuditLogs);

export default router;
