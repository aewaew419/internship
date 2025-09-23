'use client';

import { useApiQuery } from '../useApiQuery';
import { useApiMutation } from '../useApiMutation';
import { studentService } from '../../lib/api/services';
import type {
  StudentInterface,
  StudentDTO,
  StudentEnrollDTO,
  StudentEvaluateCompanyDTO,
  EvaluationStatusResponse,
  SubmissionResponse,
} from '../../types/api';

/**
 * Hook for getting student information
 */
export function useStudentInformation(enabled = true) {
  return useApiQuery<StudentInterface>(
    () => studentService.getStudentInformationWithRetry(),
    {
      enabled,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for updating student information
 */
export function useUpdateStudentInformation() {
  return useApiMutation<any, StudentDTO | FormData>(
    (data) => studentService.updateStudentInformation(data),
    {
      onSuccess: () => {
        console.log('Student information updated successfully');
      },
    }
  );
}

/**
 * Hook for getting student enrollments
 */
export function useStudentEnrollments(enabled = true) {
  return useApiQuery<any[]>(
    () => studentService.getStudentEnrollments(),
    {
      enabled,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for getting student enrollment by ID
 */
export function useStudentEnrollmentById(id: number, enabled = true) {
  return useApiQuery<any>(
    () => studentService.getStudentEnrollmentById(id),
    {
      enabled: enabled && !!id,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for creating student enrollment
 */
export function useCreateStudentEnrollment() {
  return useApiMutation<any, StudentEnrollDTO>(
    (data) => studentService.createStudentEnrollment(data),
    {
      onSuccess: () => {
        console.log('Student enrollment created successfully');
      },
    }
  );
}

/**
 * Hook for updating student enrollment
 */
export function useUpdateStudentEnrollment() {
  return useApiMutation<any, { id: number; data: StudentEnrollDTO }>(
    ({ id, data }) => studentService.updateStudentEnrollment(id, data),
    {
      onSuccess: () => {
        console.log('Student enrollment updated successfully');
      },
    }
  );
}

/**
 * Hook for uploading student enrollment picture
 */
export function useUploadStudentEnrollmentPicture() {
  return useApiMutation<any, { id: number; formData: FormData }>(
    ({ id, formData }) => studentService.uploadStudentEnrollmentPicture(id, formData),
    {
      onSuccess: () => {
        console.log('Student enrollment picture uploaded successfully');
      },
    }
  );
}

/**
 * Hook for getting student company evaluation
 */
export function useStudentEvaluateCompany(id: number, enabled = true) {
  return useApiQuery<any[]>(
    () => studentService.getStudentEvaluateCompany(id),
    {
      enabled: enabled && !!id,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for submitting student company evaluation
 */
export function useSubmitStudentEvaluateCompany() {
  return useApiMutation<SubmissionResponse, { id: number; data: StudentEvaluateCompanyDTO }>(
    ({ id, data }) => studentService.submitEvaluationWithRetry(id, data),
    {
      onSuccess: (result) => {
        console.log('Evaluation submitted successfully:', result.message);
      },
    }
  );
}

/**
 * Hook for checking evaluation status
 */
export function useEvaluationStatus(studentTrainingId: number, enabled = true) {
  return useApiQuery<EvaluationStatusResponse>(
    () => studentService.checkEvaluationStatus(studentTrainingId),
    {
      enabled: enabled && !!studentTrainingId,
      refetchOnMount: true,
    }
  );
}

/**
 * Hook for generating cooperation request letter
 */
export function useGenerateCoopRequestLetter() {
  return useApiMutation<
    { url: string; path: string; filename: string; size: number },
    { id: number; lang: "en" | "th"; data: { docNo: string; issueDate: string; prefix?: string } }
  >(
    ({ id, lang, data }) => studentService.generateCoopRequestLetter(id, lang, data),
    {
      onSuccess: (result) => {
        console.log('Letter generated successfully:', result.filename);
      },
    }
  );
}