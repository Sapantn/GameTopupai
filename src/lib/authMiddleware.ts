import { User, UserRole } from '../types';
import { AdminTab } from '../context/AppContext';

/**
 * List of recognized administrative staff roles
 */
export const STAFF_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
  'ORDER_MANAGER',
  'CONTENT_MANAGER',
  'SUPPORT_AGENT',
] as const;

/**
 * Granular Role-Based Access Control (RBAC) mapping for Admin tabs
 */
export const TAB_ROLE_PERMISSIONS: Record<AdminTab, readonly UserRole[]> = {
  dashboard: ['SUPER_ADMIN', 'ORDER_MANAGER', 'CONTENT_MANAGER', 'SUPPORT_AGENT'],
  orders: ['SUPER_ADMIN', 'ORDER_MANAGER'],
  catalogs: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
  games: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
  packages: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
  'payment-methods': ['SUPER_ADMIN'],
  'promo-codes': ['SUPER_ADMIN', 'CONTENT_MANAGER'],
  offers: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
  support: ['SUPER_ADMIN', 'SUPPORT_AGENT'],
  'audit-logs': ['SUPER_ADMIN', 'ORDER_MANAGER'],
  settings: ['SUPER_ADMIN'],
  staff: ['SUPER_ADMIN'],
};

/**
 * Human-readable role descriptions
 */
export const ROLE_METADATA: Record<UserRole, { label: string; description: string; badgeColor: string }> = {
  CUSTOMER: {
    label: 'Customer',
    description: 'Storefront shopper with standard top-up order capabilities',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Unrestricted operational authority across payments, settings, and team roles',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/50',
  },
  ORDER_MANAGER: {
    label: 'Order Manager',
    description: 'Authorized to verify eSewa/Khalti slips and approve/reject orders',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-500/50',
  },
  CONTENT_MANAGER: {
    label: 'Content Manager',
    description: 'Authorized to manage games, diamond packages, and promotional banners',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/50',
  },
  SUPPORT_AGENT: {
    label: 'Support Agent',
    description: 'Authorized to resolve customer inquiry tickets and live inquiries',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
  },
};

/**
 * Check if a given role is an authorized staff role
 */
export const isStaffRole = (role?: UserRole | string | null): boolean => {
  if (!role) return false;
  return STAFF_ROLES.includes(role as UserRole);
};

/**
 * Check if the active user is an authorized staff member
 */
export const isStaffUser = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return isStaffRole(user.role);
};

/**
 * Check if the active user is a standard customer
 */
export const isCustomerUser = (user: User | null | undefined): boolean => {
  if (!user) return true;
  return user.role === 'CUSTOMER';
};

/**
 * Check if a specific user role has permission to access a given admin tab
 */
export const canAccessTab = (role: UserRole | undefined, tab: AdminTab): boolean => {
  if (!role) return false;
  const allowedRoles = TAB_ROLE_PERMISSIONS[tab];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

/**
 * Retrieve all allowed admin tabs for a given user role
 */
export const getAllowedTabsForRole = (role?: UserRole): AdminTab[] => {
  if (!role || !isStaffRole(role)) return [];
  return (Object.keys(TAB_ROLE_PERMISSIONS) as AdminTab[]).filter((tab) =>
    TAB_ROLE_PERMISSIONS[tab].includes(role)
  );
};

export type AdminAuthCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'UNAUTHENTICATED' | 'CUSTOMER_FORBIDDEN' | 'INSUFFICIENT_PERMISSIONS';
      message: string;
      requiredRoles?: readonly UserRole[];
      fallbackTab?: AdminTab;
    };

/**
 * Central route authentication middleware logic.
 * Evaluates whether the user is permitted to view the requested admin tab.
 */
export const checkAdminRouteAccess = (
  user: User | null | undefined,
  targetTab: AdminTab
): AdminAuthCheckResult => {
  // 1. Unauthenticated or visitor
  if (!user) {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      message: 'Staff authentication required to access the Administrative Operations Desk.',
    };
  }

  // 2. Customer account attempting admin access
  if (user.role === 'CUSTOMER' || !isStaffRole(user.role)) {
    return {
      allowed: false,
      reason: 'CUSTOMER_FORBIDDEN',
      message: 'Access denied: Customer accounts do not have staff operational privileges.',
    };
  }

  // 3. Staff user attempting to access a specific tab without required privileges
  const allowedRoles = TAB_ROLE_PERMISSIONS[targetTab] || [];
  if (!allowedRoles.includes(user.role)) {
    const allowedTabs = getAllowedTabsForRole(user.role);
    return {
      allowed: false,
      reason: 'INSUFFICIENT_PERMISSIONS',
      message: `Your staff role (${ROLE_METADATA[user.role].label}) is not authorized to access this module.`,
      requiredRoles: allowedRoles,
      fallbackTab: allowedTabs[0] || 'dashboard',
    };
  }

  return { allowed: true };
};
