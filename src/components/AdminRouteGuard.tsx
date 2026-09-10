import React from 'react';
import { useApp } from '../context/AppContext';
import {
  checkAdminRouteAccess,
  isStaffUser,
} from '../lib/authMiddleware';
import { AdminAccessGate } from '../pages/admin/AdminAccessGate';
import { AdminPermissionDenied } from '../pages/admin/AdminPermissionDenied';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Authentication & Role Authorization Middleware Guard Component
 * Restricts access to administrative pages based on the user's role,
 * preventing unauthorized access by customers and guests.
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, adminTab } = useApp();

  // 1. Staff Authentication Check
  if (!isStaffUser(user)) {
    // Unauthenticated visitors or customers are blocked at the Security Gate
    return <AdminAccessGate>{children}</AdminAccessGate>;
  }

  // 2. Granular Tab Authorization Check (RBAC)
  const accessResult = checkAdminRouteAccess(user, adminTab);
  if (accessResult.allowed === false) {
    if (accessResult.reason === 'INSUFFICIENT_PERMISSIONS') {
      return <AdminPermissionDenied attemptedTab={adminTab} />;
    }
    return <AdminAccessGate>{children}</AdminAccessGate>;
  }

  // User is authorized staff with valid permissions for this module
  return <>{children}</>;
};
