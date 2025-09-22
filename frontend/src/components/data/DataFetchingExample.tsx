'use client';

import { useState } from 'react';
import { useStudentInformation, useUpdateStudentInformation } from '../../hooks/api/useStudent';
import { useLoadingState } from '../../hooks/useLoadingState';

interface DataFetchingExampleProps {
  studentId?: number;
}

/**
 * Example component demonstrating Next.js data fetching patterns
 * with mobile-optimized loading states
 */
export function DataFetchingExample({ studentId }: DataFetchingExampleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { startLoading, stopLoading, isLoading } = useLoadingState();

  // Query hook for fetching data
  const {
    data: studentData,
    loading: fetchLoading,
    error: fetchError,
    refetch,
    isRefetching,
  } = useStudentInformation(!!studentId);

  // Mutation hook for updating data
  const {
    mutate: updateStudent,
    loading: updateLoading,
    error: updateError,
  } = useUpdateStudentInformation();

  const handleRefresh = async () => {
    startLoading('refresh');
    try {
      await refetch();
    } finally {
      stopLoading('refresh');
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateStudent(formData);
      setIsEditing(false);
      // Refetch data after successful update
      await refetch();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Update failed:', error);
    }
  };

  // Loading state for initial fetch
  if (fetchLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Data</h3>
        <p className="text-red-600 text-sm mb-4">{fetchError.message}</p>
        <button
          onClick={handleRefresh}
          disabled={isLoading('refresh')}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading('refresh') ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  // No data state
  if (!studentData) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No student data available</p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Load Data
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Student Information</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefetching || isLoading('refresh')}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefetching || isLoading('refresh') ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={updateLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Data display */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <p className="text-gray-900">{studentData.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{studentData.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <p className="text-gray-900">{studentData.studentId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GPAX
            </label>
            <p className="text-gray-900">{studentData.gpax || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Update error display */}
      {updateError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{updateError.message}</p>
        </div>
      )}

      {/* Edit form (simplified example) */}
      {isEditing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleUpdate(formData);
          }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={studentData.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={studentData.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={updateLoading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}