export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "./useMediaQuery";
export { useBreadcrumbs } from "./useBreadcrumbs";
export { useAuth } from "./useAuth";
export { useDashboard } from "./useDashboard";

// API hooks
export { useApiQuery } from './useApiQuery';
export { useApiMutation } from './useApiMutation';
export { useLoadingState } from './useLoadingState';

// Specific API hooks
export * from './api/useUser';
export * from './api/useStudent';