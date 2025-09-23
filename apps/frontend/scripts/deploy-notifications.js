#!/usr/bin/env node

/**
 * Deployment script for notification system components
 * This script prepares the notification system for production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  vapidKeysFile: '.env.local',
  serviceWorkerPath: 'public/sw.js',
  manifestPath: 'public/manifest.json',
  buildDir: '.next',
  outputDir: 'deployment-config'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

// Generate VAPID keys if they don't exist
function generateVapidKeys() {
  logStep('VAPID', 'Checking VAPID keys...');
  
  const envPath = path.join(process.cwd(), CONFIG.vapidKeysFile);
  
  if (!fs.existsSync(envPath)) {
    logWarning('No .env.local file found. Creating with placeholder VAPID keys...');
    
    // Generate placeholder keys (in production, use proper VAPID key generation)
    const publicKey = crypto.randomBytes(65).toString('base64url');
    const privateKey = crypto.randomBytes(32).toString('base64url');
    
    const envContent = `# Notification System Configuration
# Replace these with actual VAPID keys generated using web-push library

# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Notification Service Configuration
NEXT_PUBLIC_NOTIFICATION_API_URL=\${NEXT_PUBLIC_API_URL}/notifications
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_OFFLINE_NOTIFICATIONS=true

# Service Worker Configuration
NEXT_PUBLIC_SW_UPDATE_INTERVAL=3600000
NEXT_PUBLIC_SW_CACHE_VERSION=v1

# Analytics and Monitoring
NEXT_PUBLIC_NOTIFICATION_ANALYTICS=true
NEXT_PUBLIC_ERROR_REPORTING=true
`;
    
    fs.writeFileSync(envPath, envContent);
    logSuccess('Created .env.local with placeholder VAPID keys');
    logWarning('IMPORTANT: Replace placeholder VAPID keys with actual keys before production deployment!');
  } else {
    logSuccess('VAPID keys configuration file exists');
  }
}

// Validate service worker configuration
function validateServiceWorker() {
  logStep('SW', 'Validating service worker configuration...');
  
  const swPath = path.join(process.cwd(), CONFIG.serviceWorkerPath);
  
  if (!fs.existsSync(swPath)) {
    logError('Service worker file not found!');
    return false;
  }
  
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check for required push notification handlers
  const requiredHandlers = [
    'addEventListener(\'push\'',
    'addEventListener(\'notificationclick\'',
    'addEventListener(\'notificationclose\'',
    'addEventListener(\'sync\''
  ];
  
  const missingHandlers = requiredHandlers.filter(handler => 
    !swContent.includes(handler)
  );
  
  if (missingHandlers.length > 0) {
    logError(`Service worker missing required handlers: ${missingHandlers.join(', ')}`);
    return false;
  }
  
  logSuccess('Service worker configuration is valid');
  return true;
}

// Update manifest.json for PWA notifications
function updateManifest() {
  logStep('PWA', 'Updating PWA manifest for notifications...');
  
  const manifestPath = path.join(process.cwd(), CONFIG.manifestPath);
  
  if (!fs.existsSync(manifestPath)) {
    logWarning('Manifest file not found. Creating basic manifest...');
    
    const manifest = {
      name: "Internship Management System",
      short_name: "Internship System",
      description: "Internship management system with push notifications",
      start_url: "/",
      display: "standalone",
      background_color: "#f3f3f3",
      theme_color: "#f28362",
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      permissions: ["notifications"],
      gcm_sender_id: "103953800507"
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    logSuccess('Created basic PWA manifest');
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Ensure notification permissions are included
    if (!manifest.permissions || !manifest.permissions.includes('notifications')) {
      manifest.permissions = manifest.permissions || [];
      manifest.permissions.push('notifications');
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      logSuccess('Added notification permissions to manifest');
    } else {
      logSuccess('Manifest already includes notification permissions');
    }
  }
}

// Create deployment configuration files
function createDeploymentConfig() {
  logStep('CONFIG', 'Creating deployment configuration files...');
  
  const outputDir = path.join(process.cwd(), CONFIG.outputDir);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Nginx configuration for service worker and notifications
  const nginxConfig = `# Nginx configuration for notification system
location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    add_header Service-Worker-Allowed "/";
}

location /manifest.json {
    add_header Cache-Control "public, max-age=86400";
    add_header Content-Type "application/manifest+json";
}

# Push notification endpoints
location /api/notifications/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Enable Server-Sent Events
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
}

# WebSocket support for real-time notifications
location /ws/notifications {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
`;
  
  fs.writeFileSync(path.join(outputDir, 'nginx-notifications.conf'), nginxConfig);
  
  // Docker environment variables
  const dockerEnv = `# Docker environment variables for notification system
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Notification service URLs
NEXT_PUBLIC_NOTIFICATION_API_URL=https://yourdomain.com/api/notifications
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/ws/notifications

# Feature flags
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_OFFLINE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_NOTIFICATION_ANALYTICS=true

# Performance settings
NEXT_PUBLIC_SW_UPDATE_INTERVAL=3600000
NEXT_PUBLIC_NOTIFICATION_CACHE_TTL=300000
NEXT_PUBLIC_MAX_CACHED_NOTIFICATIONS=100
`;
  
  fs.writeFileSync(path.join(outputDir, 'docker.env'), dockerEnv);
  
  // Kubernetes ConfigMap
  const k8sConfig = `apiVersion: v1
kind: ConfigMap
metadata:
  name: notification-config
  namespace: internship-system
data:
  NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: "true"
  NEXT_PUBLIC_ENABLE_OFFLINE_NOTIFICATIONS: "true"
  NEXT_PUBLIC_ENABLE_NOTIFICATION_ANALYTICS: "true"
  NEXT_PUBLIC_SW_UPDATE_INTERVAL: "3600000"
  NEXT_PUBLIC_NOTIFICATION_CACHE_TTL: "300000"
  NEXT_PUBLIC_MAX_CACHED_NOTIFICATIONS: "100"
---
apiVersion: v1
kind: Secret
metadata:
  name: notification-secrets
  namespace: internship-system
type: Opaque
data:
  # Base64 encoded VAPID keys
  VAPID_PUBLIC_KEY: # echo -n "your_public_key" | base64
  VAPID_PRIVATE_KEY: # echo -n "your_private_key" | base64
  VAPID_SUBJECT: # echo -n "mailto:admin@yourdomain.com" | base64
`;
  
  fs.writeFileSync(path.join(outputDir, 'k8s-notification-config.yaml'), k8sConfig);
  
  // Health check script
  const healthCheck = `#!/bin/bash
# Health check script for notification system

echo "Checking notification system health..."

# Check if service worker is accessible
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sw.js)
if [ "$SW_STATUS" != "200" ]; then
    echo "❌ Service worker not accessible (HTTP $SW_STATUS)"
    exit 1
fi

# Check if manifest is accessible
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.json)
if [ "$MANIFEST_STATUS" != "200" ]; then
    echo "❌ PWA manifest not accessible (HTTP $MANIFEST_STATUS)"
    exit 1
fi

# Check notification API endpoints
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/notifications/health)
if [ "$API_STATUS" != "200" ]; then
    echo "⚠️  Notification API health check failed (HTTP $API_STATUS)"
fi

echo "✅ Notification system health check passed"
exit 0
`;
  
  fs.writeFileSync(path.join(outputDir, 'health-check.sh'), healthCheck);
  fs.chmodSync(path.join(outputDir, 'health-check.sh'), '755');
  
  logSuccess('Created deployment configuration files');
}

// Generate deployment checklist
function generateChecklist() {
  logStep('CHECKLIST', 'Generating deployment checklist...');
  
  const checklist = `# Notification System Deployment Checklist

## Pre-deployment Setup

### 1. VAPID Keys Configuration
- [ ] Generate proper VAPID keys using web-push library
- [ ] Replace placeholder keys in .env.local
- [ ] Set VAPID_SUBJECT to your domain email
- [ ] Verify keys are properly base64url encoded

### 2. Environment Variables
- [ ] Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in production environment
- [ ] Set VAPID_PRIVATE_KEY securely (not in client-side code)
- [ ] Configure NEXT_PUBLIC_NOTIFICATION_API_URL
- [ ] Set appropriate cache TTL values

### 3. Service Worker
- [ ] Verify service worker is properly built and accessible at /sw.js
- [ ] Test push notification handlers
- [ ] Verify background sync functionality
- [ ] Test offline notification storage

### 4. PWA Manifest
- [ ] Verify manifest.json includes notification permissions
- [ ] Test PWA installation on mobile devices
- [ ] Verify notification icons are properly sized and accessible

## Backend Integration

### 5. API Endpoints
- [ ] Implement /api/notifications endpoints
- [ ] Set up push notification sending service
- [ ] Configure WebSocket/SSE for real-time updates
- [ ] Implement notification analytics endpoints

### 6. Database
- [ ] Create notification tables/collections
- [ ] Set up device token storage
- [ ] Implement notification settings storage
- [ ] Configure notification history retention

### 7. Security
- [ ] Implement proper authentication for notification endpoints
- [ ] Set up CORS policies for notification requests
- [ ] Validate push subscription data
- [ ] Implement rate limiting for notification APIs

## Infrastructure

### 8. Server Configuration
- [ ] Configure nginx/Apache for service worker caching
- [ ] Set up proper HTTPS (required for push notifications)
- [ ] Configure WebSocket proxy if using real-time updates
- [ ] Set up monitoring for notification delivery

### 9. CDN and Caching
- [ ] Configure CDN to not cache service worker
- [ ] Set appropriate cache headers for notification assets
- [ ] Configure cache invalidation for notification updates

### 10. Monitoring and Analytics
- [ ] Set up notification delivery monitoring
- [ ] Configure error tracking for push notifications
- [ ] Implement notification engagement analytics
- [ ] Set up alerts for notification failures

## Testing

### 11. Functional Testing
- [ ] Test push notification delivery on different browsers
- [ ] Test offline notification functionality
- [ ] Verify notification actions work correctly
- [ ] Test notification settings synchronization

### 12. Cross-browser Testing
- [ ] Test on Chrome/Edge (full support)
- [ ] Test on Firefox (limited support)
- [ ] Test on Safari (where supported)
- [ ] Test fallback behavior on unsupported browsers

### 13. Mobile Testing
- [ ] Test PWA notifications on Android
- [ ] Test web notifications on iOS Safari
- [ ] Verify touch-optimized notification interactions
- [ ] Test notification bar on mobile devices

### 14. Performance Testing
- [ ] Test notification system under load
- [ ] Verify service worker performance
- [ ] Test offline storage limits
- [ ] Monitor notification delivery latency

## Post-deployment

### 15. Monitoring
- [ ] Monitor notification delivery rates
- [ ] Track user engagement with notifications
- [ ] Monitor service worker update cycles
- [ ] Track offline functionality usage

### 16. User Education
- [ ] Provide clear notification permission requests
- [ ] Document notification settings for users
- [ ] Create help documentation for notification features
- [ ] Monitor user feedback on notification experience

## Troubleshooting

### Common Issues
- Service worker not updating: Check cache headers and versioning
- Push notifications not received: Verify VAPID keys and subscription
- Offline functionality not working: Check IndexedDB and cache implementation
- High battery usage: Review background sync frequency and optimization

### Debug Tools
- Chrome DevTools Application tab for service worker debugging
- Firefox Developer Tools for push notification testing
- Browser console for notification API errors
- Network tab for API request monitoring

## Security Considerations

### 17. Data Protection
- [ ] Encrypt sensitive notification data
- [ ] Implement proper data retention policies
- [ ] Ensure GDPR compliance for notification data
- [ ] Secure device token storage

### 18. Privacy
- [ ] Implement clear notification consent mechanisms
- [ ] Allow users to control notification types
- [ ] Provide easy unsubscribe options
- [ ] Respect user privacy preferences

## Performance Optimization

### 19. Optimization
- [ ] Implement notification batching for efficiency
- [ ] Optimize service worker cache strategies
- [ ] Use efficient data structures for notification storage
- [ ] Implement intelligent background sync scheduling

### 20. Scalability
- [ ] Plan for notification volume scaling
- [ ] Implement notification queue management
- [ ] Consider notification service clustering
- [ ] Plan for database scaling with notification growth
`;
  
  const outputDir = path.join(process.cwd(), CONFIG.outputDir);
  fs.writeFileSync(path.join(outputDir, 'deployment-checklist.md'), checklist);
  
  logSuccess('Generated deployment checklist');
}

// Main deployment preparation function
async function main() {
  log('🚀 Preparing Notification System for Production Deployment', 'bright');
  log('=' .repeat(60), 'blue');
  
  try {
    // Step 1: Generate/check VAPID keys
    generateVapidKeys();
    
    // Step 2: Validate service worker
    if (!validateServiceWorker()) {
      logError('Service worker validation failed. Please fix the issues before deployment.');
      process.exit(1);
    }
    
    // Step 3: Update PWA manifest
    updateManifest();
    
    // Step 4: Create deployment configuration
    createDeploymentConfig();
    
    // Step 5: Generate deployment checklist
    generateChecklist();
    
    log('=' .repeat(60), 'blue');
    log('✅ Notification System Deployment Preparation Complete!', 'green');
    log('', 'reset');
    log('Next steps:', 'bright');
    log('1. Review and update VAPID keys in .env.local', 'yellow');
    log('2. Check deployment configuration files in ./deployment-config/', 'yellow');
    log('3. Follow the deployment checklist for production setup', 'yellow');
    log('4. Test notification functionality in staging environment', 'yellow');
    log('', 'reset');
    
  } catch (error) {
    logError(`Deployment preparation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateVapidKeys,
  validateServiceWorker,
  updateManifest,
  createDeploymentConfig,
  generateChecklist
};