'use client';

import { useApiQuery } from '../useApiQuery';
import { useApiMutation } from '../useApiMutation';
import { userService } from '../../lib/api/services';
import type { LoginDTO, StudentLoginDTO, UserInterface, UserListInterface, InstructorInterface } from '../../types/api';

/**
 * Hook for user login
 */
export function useLogin() {
  return useApiMutation<UserInterface, LoginDTO>(
    (credentials) => userService.loginWithRetry(credentials),
    {
      onSuccess: (data) => {
        // Store user data in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_account', JSON.stringify(data));
        }
      },
    }
  );
}

/**
 * Hook for student login
 */
export function useStudentLogin() {
  return useApiMutation<UserInterface, StudentLoginDTO>(
    (credentials) => userService.studentLoginWithRetry(credentials),
    {
      onSuccess: (data) => {
        // Store user data in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_account', JSON.stringify(data));
        }
      },
    }
  );
}

/**
 * Hook for admin login
 */
export function useAdminLogin() {
  return useApiMutation<UserInterface, LoginDTO>(
    (credentials) => userService.adminLoginWithRetry(credentials),
    {
      onSuccess: (data) => {
        // Store user data in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_account', JSON.stringify(data));
        }
      },
    }
  );
}

/**
 * Hook for getting current user data
 */
export function useCurrentUser(enabled = true) {
  return useApiQuery(
    () => userService.getCurrentUser(),
    {
      enabled,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for getting all users (admin only)
 */
export function useUsers(enabled = true) {
  return useApiQuery<UserListInterface[]>(
    () => userService.getUsers(),
    {
      enabled,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for getting all instructors
 */
export function useInstructors(enabled = true) {
  return useApiQuery<InstructorInterface[]>(
    () => userService.getInstructors(),
    {
      enabled,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for uploading users via Excel
 */
export function useUploadUsers() {
  return useApiMutation<any, FormData>(
    (formData) => userService.uploadUsersFromExcel(formData),
    {
      onSuccess: () => {
        console.log('Users uploaded successfully');
      },
    }
  );
}

/**
 * Hook for deleting users
 */
export function useDeleteUsers() {
  return useApiMutation<any, number[]>(
    (userIds) => userService.deleteUsers(userIds),
    {
      onSuccess: () => {
        console.log('Users deleted successfully');
      },
    }
  );
}

/**
 * Hook for user registration
 */
export function useRegister() {
  return useApiMutation<UserInterface, {
    student_id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }>(
    (registrationData) => userService.registerWithRetry(registrationData),
    {
      onSuccess: (data) => {
        // Store user data in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_account', JSON.stringify(data));
        }
      },
    }
  );
}

/**
 * Hook for checking student ID availability
 */
export function useCheckStudentId() {
  return useApiMutation<{ available: boolean; message?: string }, string>(
    (studentId) => userService.checkStudentIdAvailabilityWithRetry(studentId)
  );
}

/**
 * Hook for checking email availability
 */
export function useCheckEmail() {
  return useApiMutation<{ available: boolean; message?: string }, string>(
    (email) => userService.checkEmailAvailabilityWithRetry(email)
  );
}

/**
 * Hook for forgot password
 */
export function useForgotPassword() {
  return useApiMutation<{ success: boolean; message: string }, string>(
    (email) => userService.forgotPasswordWithRetry(email)
  );
}

/**
 * Hook for reset password
 */
export function useResetPassword() {
  return useApiMutation<{ success: boolean; message: string }, {
    token: string;
    password: string;
    confirmPassword: string;
  }>(
    ({ token, password, confirmPassword }) => 
      userService.resetPasswordWithRetry(token, password, confirmPassword)
  );
}