// Performance budgets for authentication components
export const PERFORMANCE_BUDGETS = {
  // Component render times (milliseconds)
  LOGIN_FORM_RENDER: 16, // 60fps target
  REGISTRATION_FORM_RENDER: 20,
  FORGOT_PASSWORD_MODAL_RENDER: 10,
  
  // Interaction response times (milliseconds)
  INPUT_VALIDATION: 100,
  FORM_SUBMISSION: 1000,
  MODAL_OPEN: 200,
  MODAL_CLOSE: 150,
  
  // Network requests (milliseconds)
  LOGIN_API_CALL: 3000,
  VALIDATION_API_CALL: 1000,
  PASSWORD_RESET_API_CALL: 5000,
  
  // Bundle sizes (bytes)
  LOGIN_FORM_BUNDLE: 50 * 1024, // 50KB
  REGISTRATION_FORM_BUNDLE: 75 * 1024, // 75KB
  FORGOT_PASSWORD_BUNDLE: 25 * 1024, // 25KB
  
  // Memory usage (bytes)
  COMPONENT_MEMORY_LIMIT: 5 * 1024 * 1024, // 5MB
  VALIDATION_CACHE_LIMIT: 1 * 1024 * 1024, // 1MB
  
  // Core Web Vitals
  LARGEST_CONTENTFUL_PAINT: 2500, // 2.5s
  FIRST_INPUT_DELAY: 100, // 100ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // 0.1
  FIRST_CONTENTFUL_PAINT: 1800, // 1.8s
  TIME_TO_INTERACTIVE: 3800, // 3.8s
};

// Performance thresholds for different priority levels
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: {
    RENDER_TIME: 8, // < 8ms
    INTERACTION_TIME: 50, // < 50ms
    API_RESPONSE: 1000, // < 1s
  },
  GOOD: {
    RENDER_TIME: 16, // < 16ms
    INTERACTION_TIME: 100, // < 100ms
    API_RESPONSE: 2000, // < 2s
  },
  NEEDS_IMPROVEMENT: {
    RENDER_TIME: 32, // < 32ms
    INTERACTION_TIME: 200, // < 200ms
    API_RESPONSE: 4000, // < 4s
  },
  POOR: {
    RENDER_TIME: 50, // >= 50ms
    INTERACTION_TIME: 300, // >= 300ms
    API_RESPONSE: 6000, // >= 6s
  },
};

// Performance monitoring configuration
export const PERFORMANCE_CONFIG = {
  // Enable/disable monitoring features
  ENABLE_RENDER_MONITORING: true,
  ENABLE_INTERACTION_MONITORING: true,
  ENABLE_MEMORY_MONITORING: true,
  ENABLE_NETWORK_MONITORING: true,
  ENABLE_WEB_VITALS_MONITORING: true,
  
  // Sampling rates (0-1)
  RENDER_SAMPLING_RATE: 1.0, // Monitor all renders in development
  INTERACTION_SAMPLING_RATE: 1.0, // Monitor all interactions
  ERROR_SAMPLING_RATE: 1.0, // Monitor all errors
  
  // Reporting configuration
  REPORT_INTERVAL: 30000, // 30 seconds
  BATCH_SIZE: 50, // Number of metrics to batch
  MAX_QUEUE_SIZE: 1000, // Maximum metrics queue size
  
  // Development vs production settings
  DEVELOPMENT: {
    LOG_TO_CONSOLE: true,
    SHOW_PERFORMANCE_OVERLAY: true,
    DETAILED_LOGGING: true,
  },
  PRODUCTION: {
    LOG_TO_CONSOLE: false,
    SHOW_PERFORMANCE_OVERLAY: false,
    DETAILED_LOGGING: false,
  },
};

// Performance alert configuration
export const PERFORMANCE_ALERTS = {
  // Critical performance issues
  CRITICAL: {
    RENDER_TIME_THRESHOLD: 100, // > 100ms
    MEMORY_LEAK_THRESHOLD: 10 * 1024 * 1024, // > 10MB increase
    ERROR_RATE_THRESHOLD: 0.05, // > 5% error rate
  },
  
  // Warning level issues
  WARNING: {
    RENDER_TIME_THRESHOLD: 50, // > 50ms
    MEMORY_USAGE_THRESHOLD: 50 * 1024 * 1024, // > 50MB total
    SLOW_INTERACTION_THRESHOLD: 500, // > 500ms
  },
  
  // Info level notifications
  INFO: {
    RENDER_TIME_THRESHOLD: 25, // > 25ms
    CACHE_HIT_RATE_THRESHOLD: 0.8, // < 80% cache hit rate
  },
};

// Component-specific performance targets
export const COMPONENT_TARGETS = {
  LoginForm: {
    initialRender: 16,
    updateRender: 8,
    validation: 50,
    submission: 1000,
    memoryUsage: 2 * 1024 * 1024, // 2MB
  },
  
  AccessibleLoginForm: {
    initialRender: 20, // Slightly higher due to accessibility features
    updateRender: 10,
    validation: 75,
    submission: 1200,
    memoryUsage: 3 * 1024 * 1024, // 3MB
  },
  
  RegistrationForm: {
    initialRender: 25,
    updateRender: 12,
    validation: 100,
    submission: 1500,
    memoryUsage: 4 * 1024 * 1024, // 4MB
  },
  
  ForgotPasswordModal: {
    initialRender: 12,
    updateRender: 6,
    validation: 30,
    submission: 800,
    memoryUsage: 1 * 1024 * 1024, // 1MB
  },
};

// Utility functions for performance monitoring
export const getPerformanceGrade = (value: number, thresholds: typeof PERFORMANCE_THRESHOLDS.EXCELLENT) => {
  if (value <= thresholds.RENDER_TIME) return 'EXCELLENT';
  if (value <= PERFORMANCE_THRESHOLDS.GOOD.RENDER_TIME) return 'GOOD';
  if (value <= PERFORMANCE_THRESHOLDS.NEEDS_IMPROVEMENT.RENDER_TIME) return 'NEEDS_IMPROVEMENT';
  return 'POOR';
};

export const formatPerformanceMetric = (value: number, unit: 'ms' | 'bytes' | 'percent') => {
  switch (unit) {
    case 'ms':
      return `${value.toFixed(2)}ms`;
    case 'bytes':
      if (value < 1024) return `${value}B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)}KB`;
      return `${(value / 1024 / 1024).toFixed(2)}MB`;
    case 'percent':
      return `${(value * 100).toFixed(2)}%`;
    default:
      return value.toString();
  }
};

export const isPerformanceBudgetExceeded = (
  componentName: string,
  metricName: string,
  value: number
): boolean => {
  const component = COMPONENT_TARGETS[componentName as keyof typeof COMPONENT_TARGETS];
  if (!component) return false;
  
  const threshold = component[metricName as keyof typeof component];
  return typeof threshold === 'number' && value > threshold;
};