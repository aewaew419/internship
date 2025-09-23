'use client';

import { useApiQuery } from '../useApiQuery';
import { useApiMutation } from '../useApiMutation';
import { userService } from '../../lib/api/services';
import type { LoginDTO, UserInterface, UserListInterface, InstructorInterface } from '../../types/api';

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