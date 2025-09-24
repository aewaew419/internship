export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "./useMediaQuery";
export { useBreadcrumbs } from "./useBreadcrumbs";
export { useAuth, useEnhancedAuth } from "./useAuth";
export { useStudentAuth } from "./useStudentAuth";
export { useAdminAuth } from "./useAdminAuth";
export { useAuthValidation } from "./useAuthValidation";
export { useDashboard } from "./useDashboard";

// API hooks
export { useApiQuery } from './useApiQuery';
export { useApiMutation } from './useApiMutation';
export { useLoadingState } from './useLoadingState';

// Loading state management hooks
export { 
  useLoadingStateManager, 
  useFormLoadingState, 
  useAuthLoadingState,
  useMultiStepLoadingState 
} from './useLoadingStateManager';
export { 
  useAuthLoadingStates, 
  useRegistrationLoadingStates 
} from './useAuthLoadingStates';

// Offline detection and handling hooks
export { useOfflineDetection } from './useOfflineDetection';
export { useFormPersistence } from './useFormPersistence';
export { useOfflineQueue } from './useOfflineQueue';
export { useOfflineAuth } from './useOfflineAuth';

// Specific API hooks
export * from './api/useUser';
export * from './api/useStudent';