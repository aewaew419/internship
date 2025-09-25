// Authentication Error Handling System
export { AuthErrorHandler } from './error-handler';
export { AuthErrorReporter } from './error-reporter';

// Types
export type {
  AuthErrorContext,
  AuthErrorRecovery,
  AuthRecoveryStep,
  ProcessedAuthError,
} from './error-handler';

export type {
  ErrorReport,
  DeviceInfo,
  SessionInfo,
  ErrorAnalytics,
} from './error-reporter';