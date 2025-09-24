"use client";

import { useCallback, useMemo } from "react";
import { useEnhancedAuth } from "./useAuth";
import type { StudentLoginDTO, StudentUser } from "@/types/auth";

/**
 * Student-specific authentication hook
 * Provides student-specific authentication logic and utilities
 */
export const useStudentAuth = () => {
  const auth = useEnhancedAuth();

  // Student-specific login
  const loginAsStudent = useCallback(async (credentials: StudentLoginDTO) => {
    return auth.login(credentials, 'student');
  }, [auth]);

  // Get student profile data
  const getStudentProfile = useCallback(() => {
    if (!auth.user || auth.userType !== 'student') return null;
    return (auth.user as StudentUser).profile;
  }, [auth.user, auth.userType]);

  // Get student ID
  const getStudentId = useCallback((): string | null => {
    if (!auth.user || auth.userType !== 'student') return null;
    return (auth.user as StudentUser).student_id;
  }, [auth.user, auth.userType]);

  // Check if user is a student
  const isStudent = useMemo(() => {
    return auth.userType === 'student' && auth.isAuthenticated;
  }, [auth.userType, auth.isAuthenticated]);

  // Get student academic information
  const getAcademicInfo = useCallback(() => {
    const profile = getStudentProfile();
    if (!profile) return null;

    return {
      studentId: profile.studentId,
      gpax: profile.gpax,
      campusId: profile.campusId,
      facultyId: profile.facultyId,
      programId: profile.programId,
      curriculumId: profile.curriculumId,
      majorId: profile.majorId,
    };
  }, [getStudentProfile]);

  // Get student contact information
  const getContactInfo = useCallback(() => {
    const profile = getStudentProfile();
    if (!profile) return null;

    return {
      email: profile.email || auth.user?.email,
      phoneNumber: profile.phoneNumber,
    };
  }, [getStudentProfile, auth.user]);

  // Validate student ID format
  const validateStudentId = useCallback((studentId: string): boolean => {
    const studentIdPattern = /^[0-9]{8,10}$/;
    return studentIdPattern.test(studentId);
  }, []);

  // Get student display name
  const getStudentDisplayName = useCallback((): string => {
    const profile = getStudentProfile();
    if (!profile) return auth.getUserDisplayName();

    const middleName = profile.middleName ? ` ${profile.middleName}` : '';
    return `${profile.name}${middleName} ${profile.surname}`.trim();
  }, [getStudentProfile, auth]);

  // Check student permissions
  const hasStudentPermission = useCallback((permission: string): boolean => {
    if (!isStudent) return false;
    return auth.hasPermission(permission);
  }, [isStudent, auth]);

  return {
    // Authentication state
    user: auth.user as StudentUser | null,
    isAuthenticated: auth.isAuthenticated && isStudent,
    isLoading: auth.isLoading,
    error: auth.error,
    isStudent,

    // Student-specific methods
    login: loginAsStudent,
    logout: auth.logout,
    getStudentProfile,
    getStudentId,
    getAcademicInfo,
    getContactInfo,
    getStudentDisplayName,
    validateStudentId,
    hasStudentPermission,

    // Utility methods
    clearError: auth.clearError,
    refreshAuth: auth.refreshAuth,
  };
};