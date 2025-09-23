# Notification System Deployment Guide

This guide covers the deployment of the push notification system for the Internship Management System.

## Overview

The notification system includes:
- Push notifications via Service Worker
- Real-time notifications via WebSocket/SSE
- Offline notification storage and sync
- Mobile-optimized notification UI
- Cross-browser compatibility
- Analytics and monitoring

## Prerequisites

### 1. VAPID Keys Generation

Generate VAPID keys using the web-push library:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### 2. Environment Setup

Copy the production environment template:

```bash
cp .env.production.template .env.local
```

Update the following critical variables:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Your VAPID public key
- `VAPID_PRIVATE_KEY`: Your VAPID private key (keep secure!)
- `VAPID_SUBJECT`: Your contact email (mailto:admin@yourdomain.com)
- `NEXT_PUBLIC_API_BASE_URL`: Your backend API URL

## Deployment Process

### 1. Prepare Deployment

Run the deployment preparation script:

```bash
npm run deploy:notifications
```

This script will:
- Validate VAPID keys configuration
- Check service worker implementation
- Update PWA manifest
- Generate deployment configuration files
- Create deployment checklist

### 2. Build for Production

```bash
npm run prepare:production
```

This will prepare the notification system and build the application for production.

### 3. Deploy to Server

Follow your standard deployment process, ensuring:
- Service worker is served with proper cache headers
- HTTPS is enabled (required for push notifications)
- Backend notification endpoints are configured

## Server Configuration

### Nginx Configuration

Add to your nginx configuration:

```nginx
# Service Worker - No caching
location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    add_header Service-Worker-Allowed "/";
}

# PWA Manifest
location /manifest.json {
    add_header Cache-Control "public, max-age=86400";
    add_header Content-Type "application/manifest+json";
}

# Notification API endpoints
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
```

### Apache Configuration

For Apache servers, add to your .htaccess or virtual host:

```apache
# Service Worker - No caching
<Files "sw.js">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
    Header set Service-Worker-Allowed "/"
</Files>

# PWA Manifest
<Files "manifest.json">
    Header set Cache-Control "public, max-age=86400"
    Header set Content-Type "application/manifest+json"
</Files>
```

## Backend Integration

### Required API Endpoints

Implement these endpoints in your backend:

```
POST   /api/notifications/subscribe     - Register push subscription
DELETE /api/notifications/unsubscribe   - Remove push subscription
GET    /api/notifications               - Get user notifications
POST   /api/notifications/mark-read     - Mark notification as read
POST   /api/notifications/mark-read-bulk - Mark multiple as read
DELETE /api/notifications/:id           - Delete notification
GET    /api/notifications/settings      - Get notification settings
PUT    /api/notifications/settings      - Update notification settings
POST   /api/notifications/send          - Send push notification (admin)
GET    /api/notifications/analytics     - Get notification analytics
```

### Push Notification Sending

Example backend code for sending push notifications:

```javascript
const webpush = require('web-push');

// Configure VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
```

## Testing

### 1. Local Testing

```bash
# Start development server
npm run dev

# Test notification functionality
# - Grant notification permissions
# - Test push notifications
# - Test offline functionality
# - Test notification actions
```

### 2. Browser Testing

Test on different browsers:
- Chrome/Edge: Full support
- Firefox: Limited support
- Safari: Basic support (iOS 16.4+)

### 3. Mobile Testing

Test PWA notifications:
- Android Chrome: Full support
- iOS Safari: Limited support
- Test notification bar on mobile

### 4. Performance Testing

```bash
# Run performance tests
npm run perf:full

# Test mobile performance
npm run lighthouse:mobile
```

## Monitoring and Analytics

### 1. Notification Delivery Monitoring

Monitor these metrics:
- Notification delivery rate
- User engagement rate
- Notification click-through rate
- Error rates by browser/device

### 2. Service Worker Monitoring

Track:
- Service worker installation rate
- Update success rate
- Cache hit rates
- Background sync success

### 3. Error Tracking

Set up error tracking for:
- Push notification failures
- Service worker errors
- Subscription failures
- Network connectivity issues

## Troubleshooting

### Common Issues

1. **Notifications not received**
   - Check VAPID keys configuration
   - Verify HTTPS is enabled
   - Check browser notification permissions
   - Verify service worker registration

2. **Service worker not updating**
   - Check cache headers for sw.js
   - Verify service worker versioning
   - Clear browser cache

3. **High battery usage**
   - Review background sync frequency
   - Optimize notification batching
   - Check for excessive API calls

4. **Cross-browser issues**
   - Implement feature detection
   - Provide fallback mechanisms
   - Test on target browsers

### Debug Tools

- Chrome DevTools Application tab
- Firefox Developer Tools
- Browser console for errors
- Network tab for API monitoring

## Security Considerations

### 1. VAPID Keys Security
- Keep private key secure and never expose to client
- Rotate keys periodically
- Use environment variables for key storage

### 2. Notification Content
- Sanitize notification content
- Validate notification data
- Implement rate limiting

### 3. User Privacy
- Implement clear consent mechanisms
- Provide easy unsubscribe options
- Respect user preferences
- Comply with GDPR/privacy regulations

## Performance Optimization

### 1. Service Worker Optimization
- Implement efficient caching strategies
- Use background sync judiciously
- Optimize notification storage

### 2. Network Optimization
- Batch notification requests
- Implement request deduplication
- Use compression for large payloads

### 3. Battery Optimization
- Implement intelligent sync scheduling
- Use efficient data structures
- Minimize background processing

## Maintenance

### 1. Regular Updates
- Update service worker version
- Monitor browser compatibility
- Update notification templates

### 2. Performance Monitoring
- Monitor notification metrics
- Track user engagement
- Optimize based on usage patterns

### 3. User Feedback
- Collect user feedback on notifications
- Monitor support requests
- Iterate on user experience

## Support and Documentation

### User Documentation
- Create user guides for notification settings
- Provide troubleshooting help
- Document browser-specific instructions

### Developer Documentation
- Maintain API documentation
- Document configuration options
- Keep deployment guides updated

## Rollback Plan

In case of issues:

1. **Disable push notifications**
   ```bash
   # Set environment variable
   NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
   ```

2. **Revert service worker**
   - Deploy previous service worker version
   - Clear service worker cache

3. **Fallback to polling**
   - Enable periodic API polling
   - Disable real-time features temporarily

## Conclusion

The notification system provides a robust, scalable solution for real-time user engagement. Follow this deployment guide carefully and monitor the system closely after deployment to ensure optimal performance and user experience.

For additional support or questions, refer to the deployment checklist generated by the deployment script or contact the development team.