import { sendError } from '../utils/response.js';

export const isSuperAdminRole = (role) => role === 'superadmin' || role === 'super_admin';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    // Super Admin always has access
    if (isSuperAdminRole(req.user.role)) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

export const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthenticated user', 401);
  }

  if (!isSuperAdminRole(req.user.role)) {
    return sendError(
      res,
      `Access denied. Super Admin privileges required. Current role: ${req.user.role}`,
      403
    );
  }

  next();
};

export const canAccessRecord = (ownerField = 'assignedTo') => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthenticated user', 401);

    // Super Admins, Admins, and Sales Managers can access any record
    if (['superadmin', 'super_admin', 'admin', 'sales_manager'].includes(req.user.role)) {
      return next();
    }

    // Telecaller and Sales Executive check is handled in controller or passed through with req.user query filter
    req.recordOwnerFilter = { [ownerField]: req.user._id };
    next();
  };
};
