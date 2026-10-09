import { sendError } from '../utils/response.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    // super_admin always has access
    if (req.user.role === 'super_admin') {
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

export const canAccessRecord = (ownerField = 'assignedTo') => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthenticated user', 401);

    // Admins and Sales Managers can access any record
    if (['super_admin', 'admin', 'sales_manager'].includes(req.user.role)) {
      return next();
    }

    // Telecaller and Sales Executive check is handled in controller or passed through with req.user query filter
    req.recordOwnerFilter = { [ownerField]: req.user._id };
    next();
  };
};
