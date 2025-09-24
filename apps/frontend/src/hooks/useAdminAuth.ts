"use client";

import { useCallback, useMemo } from "react";
import { useEnhancedAuth } from "./useAuth";
import type { AdminLoginDTO, AdminUser } from "@/types/auth";

/**
 * Admin-specific authentication hook
 * Provides admin-specific authentication logic and permissions
 */
export const useAdminAuth = () => {
  const auth = useEnhancedAuth();

  // Admin-specific login
  const loginAsAdmin = useCallback(async (credentials: AdminLoginDTO) => {
    return auth.login(credentials, 'admin');
  }, [auth]);

  // Check if user is an admin
  const isAdmin = useMemo(() => {
    return auth.userType === 'admin' && auth.isAuthenticated;
  }, [auth.userType, auth.isAuthenticated]);

  // Check if user is a super admin
  const isSuperAdmin = useMemo(() => {
    return isAdmin && auth.user?.role === 'super_admin';
  }, [isAdmin, auth.user]);

  // Get admin department
  const getDepartment = useCallback((): string | null => {
    if (!auth.user || auth.userType !== 'admin') return null;
    return (auth.user as AdminUser).department || null;
  }, [auth.user, auth.userType]);

  // Check admin permissions with role-based access
  const hasAdminPermission = useCallback((permission: string): boolean => {
    if (!isAdmin) return false;
    
    // Super admins have all permissions
    if (isSuperAdmin) return true;
    
    return auth.hasPermission(permission);
  }, [isAdmin, isSuperAdmin, auth]);

  // Check if admin can access specific module
  const canAccessModule = useCallback((module: string): boolean => {
    const modulePermissions: Record<string, string[]> = {
      'users': ['user.read', 'user.manage'],
      'students': ['student.read', 'student.manage'],
      'instructors': ['instructor.read', 'instructor.manage'],
      'courses': ['course.read', 'course.manage'],
      'reports': ['report.read', 'report.generate'],
      'settings': ['setting.read', 'setting.manage'],
      'system': ['system.read', 'system.manage'],
    };

    const requiredPermissions = modulePermissions[module] || [];
    return requiredPermissions.some(permission => hasAdminPermission(permission));
  }, [hasAdminPermission]);

  // Get admin role display name
  const getRoleDisplayName = useCallback((): string => {
    if (!auth.user) return '';
    
    const roleNames: Record<string, string> = {
      'admin': 'ผู้ดูแลระบบ',
      'super_admin': 'ผู้ดูแลระบบสูงสุด',
    };

    return roleNames[auth.user.role] || auth.user.role;
  }, [auth.user]);

  // Get admin dashboard permissions
  const getDashboardPermissions = useCallback(() => {
    if (!isAdmin) return [];

    const permissions = [];
    
    if (canAccessModule('users')) permissions.push('users');
    if (canAccessModule('students')) permissions.push('students');
    if (canAccessModule('instructors')) permissions.push('instructors');
    if (canAccessModule('courses')) permissions.push('courses');
    if (canAccessModule('reports')) permissions.push('reports');
    if (canAccessModule('settings')) permissions.push('settings');
    if (canAccessModule('system')) permissions.push('system');

    return permissions;
  }, [isAdmin, canAccessModule]);

  // Validate admin email format
  const validateAdminEmail = useCallback((email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }, []);

  // Check if admin can perform action on user
  const canManageUser = useCallback((targetUserId: number): boolean => {
    if (!isAdmin) return false;
    
    // Super admins can manage all users
    if (isSuperAdmin) return true;
    
    // Regular admins can't manage other admins
    return hasAdminPermission('user.manage');
  }, [isAdmin, isSuperAdmin, hasAdminPermission]);

  // Get admin navigation items based on permissions
  const getNavigationItems = useCallback(() => {
    if (!isAdmin) return [];

    const items = [];

    if (canAccessModule('students')) {
      items.push({
        key: 'students',
        label: 'จัดการนักศึกษา',
        path: '/admin/students',
        icon: 'users',
      });
    }

    if (canAccessModule('instructors')) {
      items.push({
        key: 'instructors',
        label: 'จัดการอาจารย์',
        path: '/admin/instructors',
        icon: 'user-check',
      });
    }

    if (canAccessModule('courses')) {
      items.push({
        key: 'courses',
        label: 'จัดการรายวิชา',
        path: '/admin/courses',
        icon: 'book',
      });
    }

    if (canAccessModule('reports')) {
      items.push({
        key: 'reports',
        label: 'รายงาน',
        path: '/admin/reports',
        icon: 'bar-chart',
      });
    }

    if (canAccessModule('settings')) {
      items.push({
        key: 'settings',
        label: 'ตั้งค่าระบบ',
        path: '/admin/settings',
        icon: 'settings',
      });
    }

    return items;
  }, [isAdmin, canAccessModule]);

  return {
    // Authentication state
    user: auth.user as AdminUser | null,
    isAuthenticated: auth.isAuthenticated && isAdmin,
    isLoading: auth.isLoading,
    error: auth.error,
    isAdmin,
    isSuperAdmin,

    // Admin-specific methods
    login: loginAsAdmin,
    logout: auth.logout,
    getDepartment,
    getRoleDisplayName,
    hasAdminPermission,
    canAccessModule,
    canManageUser,
    validateAdminEmail,
    getDashboardPermissions,
    getNavigationItems,

    // Utility methods
    clearError: auth.clearError,
    refreshAuth: auth.refreshAuth,
  };
};