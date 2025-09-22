/**
 * 🔒 CSS Style Lock Configuration
 * ===============================
 * This configuration defines which styles are protected and locked
 * from modification to maintain design consistency.
 */

const styleLockConfig = {
  // 🔒 Protected CSS files that should not be modified
  protectedFiles: [
    'src/styles/protected-styles.css',
    'src/app/globals.css' // Original styles are protected
  ],

  // ✅ Safe files that can be modified
  safeFiles: [
    'src/styles/custom-styles.css',
    'src/components/**/*.module.css',
    'src/styles/themes/*.css'
  ],

  // 🔒 Protected CSS classes and selectors
  protectedSelectors: [
    // Core theme variables
    ':root',
    '@theme',
    
    // Color system
    '--color-primary-*',
    '--color-secondary-*',
    '--color-text-*',
    '--color-bg-*',
    '--background',
    '--foreground',
    '--border',
    '--input',
    '--ring',
    '--error',
    '--success',
    
    // Core component styles
    '.primary-button',
    '.secondary-button',
    '.gradient-text',
    '.bg-gradient',
    
    // Table styles
    '.start-table',
    '.table-body',
    
    // Mobile navigation
    '.mobile-nav-overlay',
    '.mobile-nav-sidebar',
    '.mobile-nav-item',
    
    // Container and layout
    '.container',
    
    // Accessibility
    '.sr-only',
    '.focus-visible',
    
    // Touch and mobile
    '.btn-touch',
    '.pb-safe',
    '.pt-safe',
    '.pl-safe',
    '.pr-safe',
    
    // Core animations
    '@keyframes spin',
    '@keyframes fadeIn',
    '@keyframes slideInFromLeft',
    '@keyframes slideInFromRight',
    '@keyframes slideInFromTop',
    '@keyframes slideInFromBottom',
    '.animate-in',
    '.fade-in-0',
    '.slide-in-from-*'
  ],

  // ⚠️ CSS properties that require approval to modify
  criticalProperties: [
    'color',
    'background-color',
    'background',
    'border-color',
    'font-family',
    'font-size',
    'line-height',
    'z-index'
  ],

  // 📝 Modification rules
  rules: {
    // Require approval for these changes
    requireApproval: [
      'Changing primary/secondary colors',
      'Modifying font family',
      'Changing container widths',
      'Altering z-index values',
      'Modifying core animations'
    ],
    
    // Allowed without approval
    allowedChanges: [
      'Adding new custom classes',
      'Creating component-specific styles',
      'Adding utility classes',
      'Creating new animations',
      'Adding responsive breakpoints'
    ],
    
    // Best practices
    bestPractices: [
      'Use custom-styles.css for new styles',
      'Create CSS modules for component-specific styles',
      'Follow existing naming conventions',
      'Test on mobile devices',
      'Document complex styles',
      'Use CSS custom properties for theming'
    ]
  },

  // 🛡️ Validation settings
  validation: {
    // Check for protected selector modifications
    checkProtectedSelectors: true,
    
    // Warn about critical property changes
    warnCriticalProperties: true,
    
    // Require comments for complex styles
    requireComments: true,
    
    // Check mobile responsiveness
    checkMobileResponsive: true
  },

  // 📊 Monitoring
  monitoring: {
    // Log style changes
    logChanges: true,
    
    // Track performance impact
    trackPerformance: true,
    
    // Monitor bundle size
    monitorBundleSize: true
  }
};

module.exports = styleLockConfig;