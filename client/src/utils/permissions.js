/**
 * RBAC Permission Helper Functions
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  SALES_EXECUTIVE: 'sales_executive',
  TELECALLER: 'telecaller',
  ACCOUNTANT: 'accountant',
  GUEST: 'guest'
};

export const hasRole = (user, allowedRoles = []) => {
  if (!user || !user.role) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(user.role);
};

export const canManageEmployees = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
};

export const canApproveDiscount = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER]);
};

export const canManageFinance = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]);
};

export const canExportReports = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.ACCOUNTANT]);
};
