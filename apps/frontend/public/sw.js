// Service Worker for offline functionality and caching
const CACHE_NAME = 'internship-app-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https?:\/\/.*\/api\/auth\/me$/,
  /^https?:\/\/.*\/api\/dashboard\/stats$/,
  /^https?:\/\/.*\/api\/users\/profile$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and initialize background sync
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && !cacheName.startsWith('notifications-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Initialize periodic background sync
      initializePeriodicSync(),
      // Schedule intelligent sync
      scheduleIntelligentSync(),
      // Claim clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Cache first strategy for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isAPIRequest(request)) {
    // Network first strategy for API requests
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (isNavigationRequest(request)) {
    // Stale while revalidate for navigation
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else {
    // Default network first
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache first strategy - good for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy - good for API requests
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && shouldCache(request)) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/offline');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate - good for pages
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/static/') ||
         url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function shouldCache(request) {
  const url = new URL(request.url);
  
  // Don't cache authentication requests
  if (url.pathname.includes('/auth/login') || url.pathname.includes('/auth/logout')) {
    return false;
  }
  
  // Don't cache POST/PUT/DELETE requests
  if (request.method !== 'GET') {
    return false;
  }
  
  return true;
}

// Enhanced background sync with intelligent scheduling and periodic fetching
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  switch (event.tag) {
    case 'notification-actions':
      event.waitUntil(syncNotificationActions());
      break;
    case 'notification-read-status':
      event.waitUntil(syncNotificationReadStatus());
      break;
    case 'notification-settings':
      event.waitUntil(syncNotificationSettings());
      break;
    case 'periodic-notification-fetch':
      event.waitUntil(performPeriodicNotificationFetch());
      break;
    case 'notification-analytics':
      event.waitUntil(syncNotificationAnalytics());
      break;
    case 'notification-cleanup':
      event.waitUntil(performNotificationCleanup());
      break;
    case 'user-activity-sync':
      event.waitUntil(syncUserActivityData());
      break;
    default:
      event.waitUntil(doEnhancedBackgroundSync(event.tag));
  }
});

// Sync offline notification actions
async function syncNotificationActions() {
  console.log('Syncing notification actions...');
  
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const pendingActions = request.result;
      
      for (const action of pendingActions) {
        try {
          await syncSingleAction(action);
          
          // Remove from pending actions after successful sync
          const deleteTransaction = db.transaction(['pendingActions'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('pendingActions');
          deleteStore.delete(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
        }
      }
    };
  } catch (error) {
    console.error('Error syncing notification actions:', error);
  }
}

// Sync single notification action
async function syncSingleAction(action) {
  const response = await fetch('/api/notifications/actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync action: ${response.statusText}`);
  }
  
  return response.json();
}

// Sync notification read status
async function syncNotificationReadStatus() {
  console.log('Syncing notification read status...');
  
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const index = store.index('isRead');
    const request = index.getAll(true); // Get all read notifications
    
    request.onsuccess = async () => {
      const readNotifications = request.result.filter(n => n.readAt && !n.synced);
      
      if (readNotifications.length > 0) {
        const response = await fetch('/api/notifications/mark-read-bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationIds: readNotifications.map(n => n.id),
          }),
        });
        
        if (response.ok) {
          // Mark as synced
          const updateTransaction = db.transaction(['notifications'], 'readwrite');
          const updateStore = updateTransaction.objectStore('notifications');
          
          readNotifications.forEach(notification => {
            notification.synced = true;
            updateStore.put(notification);
          });
        }
      }
    };
  } catch (error) {
    console.error('Error syncing notification read status:', error);
  }
}

// Sync notification settings
async function syncNotificationSettings() {
  console.log('Syncing notification settings...');
  
  try {
    const settings = await getNotificationSettings();
    
    if (settings && settings.needsSync) {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        // Mark settings as synced
        const db = await openNotificationDB();
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        delete settings.needsSync;
        store.put({ key: 'notificationSettings', value: settings });
      }
    }
  } catch (error) {
    console.error('Error syncing notification settings:', error);
  }
}

// Enhanced general background sync with intelligent scheduling
async function doEnhancedBackgroundSync(tag) {
  console.log('Enhanced background sync triggered:', tag);
  
  // Get sync preferences and user activity data
  const syncPreferences = await getSyncPreferences();
  const userActivity = await getUserActivityData();
  
  // Determine sync priority based on user activity
  const syncPriority = determineSyncPriority(userActivity, syncPreferences);
  
  // Perform sync operations based on priority
  const syncOperations = [];
  
  if (syncPriority.high) {
    syncOperations.push(
      syncNotificationActions(),
      syncNotificationReadStatus(),
      performPeriodicNotificationFetch()
    );
  }
  
  if (syncPriority.medium) {
    syncOperations.push(
      syncNotificationSettings(),
      syncNotificationAnalytics()
    );
  }
  
  if (syncPriority.low) {
    syncOperations.push(
      performNotificationCleanup(),
      syncUserActivityData()
    );
  }
  
  // Execute sync operations with error handling
  const results = await Promise.allSettled(syncOperations);
  
  // Log sync results for monitoring
  await logSyncResults(tag, results);
  
  // Schedule next sync based on results and user activity
  await scheduleNextSync(syncPreferences, userActivity, results);
}

// Perform periodic notification fetching
async function performPeriodicNotificationFetch() {
  console.log('Performing periodic notification fetch...');
  
  try {
    // Check if user is active to avoid unnecessary fetches
    const userActivity = await getUserActivityData();
    if (!shouldPerformPeriodicFetch(userActivity)) {
      console.log('Skipping periodic fetch due to user inactivity');
      return;
    }
    
    // Fetch latest notifications from server
    const response = await fetch('/api/notifications?limit=20&unread=true', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const notifications = data.notifications || [];
      
      // Process new notifications
      for (const notification of notifications) {
        await processPeriodicNotification(notification);
      }
      
      // Update cache with fresh data
      await updateNotificationCache({ notifications });
      
      // Update last fetch timestamp
      await updateLastFetchTimestamp();
      
      console.log(`Periodic fetch completed: ${notifications.length} notifications processed`);
    } else {
      console.error('Periodic fetch failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('Error during periodic notification fetch:', error);
  }
}

// Process notification from periodic fetch
async function processPeriodicNotification(notification) {
  // Check if notification already exists
  const existingNotification = await getStoredNotification(notification.id);
  
  if (!existingNotification) {
    // Store new notification
    await storeNotificationData(notification);
    
    // Check if we should show a push notification
    const settings = await getNotificationSettings();
    if (shouldShowNotification(notification, settings)) {
      // Show notification with reduced priority for periodic fetches
      const options = createEnhancedNotificationOptions(notification, settings);
      options.silent = true; // Make periodic notifications silent
      options.requireInteraction = false;
      
      await self.registration.showNotification(
        notification.title || getDefaultNotificationTitle(notification.type),
        options
      );
    }
  } else if (existingNotification.status !== notification.status) {
    // Update existing notification if status changed
    await updateStoredNotification(notification);
  }
}

// Sync notification analytics data
async function syncNotificationAnalytics() {
  console.log('Syncing notification analytics...');
  
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['analytics'], 'readonly');
    const store = transaction.objectStore('analytics');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const analyticsData = request.result || [];
      
      if (analyticsData.length > 0) {
        // Send analytics data to server
        const response = await fetch('/api/notifications/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: analyticsData }),
        });
        
        if (response.ok) {
          // Clear sent analytics data
          const deleteTransaction = db.transaction(['analytics'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('analytics');
          
          analyticsData.forEach(event => {
            deleteStore.delete(event.id);
          });
          
          console.log(`Analytics sync completed: ${analyticsData.length} events sent`);
        }
      }
    };
  } catch (error) {
    console.error('Error syncing notification analytics:', error);
  }
}

// Sync user activity data
async function syncUserActivityData() {
  console.log('Syncing user activity data...');
  
  try {
    const activityData = await getUserActivityData();
    
    if (activityData && activityData.needsSync) {
      const response = await fetch('/api/user/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });
      
      if (response.ok) {
        // Mark activity data as synced
        await updateUserActivityData({ ...activityData, needsSync: false });
        console.log('User activity data synced successfully');
      }
    }
  } catch (error) {
    console.error('Error syncing user activity data:', error);
  }
}

// Get sync preferences
async function getSyncPreferences() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('syncPreferences');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const preferences = request.result?.value || {
          frequency: 'normal', // 'high', 'normal', 'low'
          backgroundFetch: true,
          analyticsSync: true,
          cleanupFrequency: 'daily'
        };
        resolve(preferences);
      };
      request.onerror = () => resolve({
        frequency: 'normal',
        backgroundFetch: true,
        analyticsSync: true,
        cleanupFrequency: 'daily'
      });
    });
  } catch (error) {
    console.error('Error getting sync preferences:', error);
    return {
      frequency: 'normal',
      backgroundFetch: true,
      analyticsSync: true,
      cleanupFrequency: 'daily'
    };
  }
}

// Get user activity data
async function getUserActivityData() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('userActivity');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const activity = request.result?.value || {
          lastActive: Date.now(),
          sessionCount: 0,
          notificationInteractions: 0,
          averageSessionLength: 0,
          preferredSyncTimes: []
        };
        resolve(activity);
      };
      request.onerror = () => resolve({
        lastActive: Date.now(),
        sessionCount: 0,
        notificationInteractions: 0,
        averageSessionLength: 0,
        preferredSyncTimes: []
      });
    });
  } catch (error) {
    console.error('Error getting user activity data:', error);
    return {
      lastActive: Date.now(),
      sessionCount: 0,
      notificationInteractions: 0,
      averageSessionLength: 0,
      preferredSyncTimes: []
    };
  }
}

// Update user activity data
async function updateUserActivityData(activityData) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    store.put({
      key: 'userActivity',
      value: activityData
    });
  } catch (error) {
    console.error('Error updating user activity data:', error);
  }
}

// Determine sync priority based on user activity
function determineSyncPriority(userActivity, syncPreferences) {
  const now = Date.now();
  const timeSinceLastActive = now - (userActivity.lastActive || 0);
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  
  // High priority: User was recently active
  const high = timeSinceLastActive < oneHour || syncPreferences.frequency === 'high';
  
  // Medium priority: User was active within the day
  const medium = timeSinceLastActive < oneDay || syncPreferences.frequency === 'normal';
  
  // Low priority: User inactive for more than a day or low frequency preference
  const low = timeSinceLastActive >= oneDay || syncPreferences.frequency === 'low';
  
  return { high, medium, low };
}

// Check if periodic fetch should be performed
function shouldPerformPeriodicFetch(userActivity) {
  const now = Date.now();
  const timeSinceLastActive = now - (userActivity.lastActive || 0);
  const sixHours = 6 * 60 * 60 * 1000;
  
  // Don't fetch if user has been inactive for more than 6 hours
  return timeSinceLastActive < sixHours;
}

// Update last fetch timestamp
async function updateLastFetchTimestamp() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    store.put({
      key: 'lastPeriodicFetch',
      value: Date.now()
    });
  } catch (error) {
    console.error('Error updating last fetch timestamp:', error);
  }
}

// Get stored notification
async function getStoredNotification(notificationId) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const request = store.get(notificationId);
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error getting stored notification:', error);
    return null;
  }
}

// Update stored notification
async function updateStoredNotification(notification) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    store.put({
      ...notification,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating stored notification:', error);
  }
}

// Log sync results for monitoring
async function logSyncResults(tag, results) {
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const errorCount = results.filter(r => r.status === 'rejected').length;
  
  await storeAnalyticsEvent('background_sync_completed', {
    tag: tag,
    successCount: successCount,
    errorCount: errorCount,
    timestamp: Date.now()
  });
  
  console.log(`Background sync completed - Tag: ${tag}, Success: ${successCount}, Errors: ${errorCount}`);
}

// Schedule next sync based on results and user activity
async function scheduleNextSync(syncPreferences, userActivity, results) {
  // Determine next sync interval based on success rate and user activity
  const successRate = results.filter(r => r.status === 'fulfilled').length / results.length;
  const timeSinceLastActive = Date.now() - (userActivity.lastActive || 0);
  
  let nextSyncDelay;
  
  if (successRate > 0.8 && timeSinceLastActive < 60 * 60 * 1000) {
    // High success rate and recent activity - sync more frequently
    nextSyncDelay = 15 * 60 * 1000; // 15 minutes
  } else if (successRate > 0.5) {
    // Moderate success rate - normal frequency
    nextSyncDelay = 60 * 60 * 1000; // 1 hour
  } else {
    // Low success rate or inactive user - sync less frequently
    nextSyncDelay = 4 * 60 * 60 * 1000; // 4 hours
  }
  
  // Register next sync (if supported)
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Note: Actual scheduling would be done by the client
      console.log(`Next sync scheduled in ${nextSyncDelay / 1000 / 60} minutes`);
    }
  } catch (error) {
    console.error('Error scheduling next sync:', error);
  }
}

// Enhanced push notification handling with custom styling and branding
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push notification data:', data);
      
      event.waitUntil(handlePushNotification(data));
    } catch (error) {
      console.error('Error processing push notification:', error);
      
      // Enhanced fallback notification with branding
      event.waitUntil(
        self.registration.showNotification('Internship Management System', {
          body: 'You have a new notification',
          icon: '/icons/notification-icon-192.png',
          badge: '/icons/notification-badge-72.png',
          tag: 'fallback',
          data: {
            url: '/notifications',
            timestamp: Date.now(),
            type: 'system'
          },
          actions: [
            { action: 'view', title: 'View', icon: '/icons/view-24.png' },
            { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss-24.png' }
          ]
        })
      );
    }
  } else {
    // Handle push without data (server-triggered refresh)
    event.waitUntil(handleServerTriggeredRefresh());
  }
});

// Enhanced push notification handler with custom styling and background processing
async function handlePushNotification(data) {
  // Background processing - update notification cache
  await updateNotificationCache(data);
  
  // Check if user has notification settings stored
  const settings = await getNotificationSettings();
  
  // Apply user preferences and filtering
  if (!shouldShowNotification(data, settings)) {
    console.log('Notification filtered by user settings');
    // Still store for later viewing in notification center
    await storeNotificationData(data);
    return;
  }
  
  // Get existing notifications to handle grouping
  const existingNotifications = await self.registration.getNotifications();
  
  // Handle notification grouping with enhanced logic
  const groupedNotification = handleNotificationGrouping(data, existingNotifications);
  if (groupedNotification) {
    await storeNotificationData(data);
    return self.registration.showNotification(groupedNotification.title, groupedNotification.options);
  }
  
  // Create notification options with enhanced styling and branding
  const options = createEnhancedNotificationOptions(data, settings);
  
  // Store notification data for offline access and analytics
  await storeNotificationData(data);
  
  // Track notification display for analytics
  await storeAnalyticsEvent('notification_displayed', {
    notificationId: data.id,
    type: data.type,
    priority: data.priority,
    timestamp: Date.now()
  });
  
  // Show the notification with custom branding
  const title = data.title || getDefaultNotificationTitle(data.type);
  return self.registration.showNotification(title, options);
}

// Handle server-triggered refresh for real-time updates
async function handleServerTriggeredRefresh() {
  console.log('Server-triggered refresh received');
  
  // Fetch latest notifications in background
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    // Notify all open clients to refresh notifications
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_REFRESH',
        timestamp: Date.now()
      });
    });
    
    // Update notification cache
    await refreshNotificationCache();
    
  } catch (error) {
    console.error('Error handling server-triggered refresh:', error);
  }
}

// Update notification cache in background
async function updateNotificationCache(data) {
  try {
    const cache = await caches.open('notifications-v1');
    
    // Cache notification data for offline access
    const notificationResponse = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/api/notifications/${data.id}`, notificationResponse);
    
    // Update notification list cache
    await refreshNotificationListCache();
    
  } catch (error) {
    console.error('Error updating notification cache:', error);
  }
}

// Refresh notification cache
async function refreshNotificationCache() {
  try {
    const cache = await caches.open('notifications-v1');
    
    // Fetch latest notifications from API
    const response = await fetch('/api/notifications?limit=50');
    if (response.ok) {
      await cache.put('/api/notifications?limit=50', response.clone());
    }
    
  } catch (error) {
    console.error('Error refreshing notification cache:', error);
  }
}

// Refresh notification list cache
async function refreshNotificationListCache() {
  try {
    const cache = await caches.open('notifications-v1');
    
    // Update the main notification list
    const listResponse = await fetch('/api/notifications?limit=20');
    if (listResponse.ok) {
      await cache.put('/api/notifications?limit=20', listResponse.clone());
    }
    
    // Update unread count
    const countResponse = await fetch('/api/notifications/unread-count');
    if (countResponse.ok) {
      await cache.put('/api/notifications/unread-count', countResponse.clone());
    }
    
  } catch (error) {
    console.error('Error refreshing notification list cache:', error);
  }
}

// Get default notification title based on type
function getDefaultNotificationTitle(type) {
  const titles = {
    assignment_change: 'Assignment Update',
    grade_update: 'Grade Posted',
    schedule_reminder: 'Schedule Reminder',
    document_update: 'Document Required',
    deadline_reminder: 'Deadline Approaching',
    system_announcement: 'System Announcement',
    evaluation_request: 'Evaluation Required',
    visit_scheduled: 'Visit Scheduled'
  };
  
  return titles[type] || 'Internship Management System';
}

// Create enhanced notification options with custom styling and branding
function createEnhancedNotificationOptions(data, settings) {
  const baseOptions = {
    body: data.body || 'New notification from Internship Management System',
    icon: getNotificationIcon(data.type, data.priority),
    badge: '/icons/notification-badge-72.png',
    image: data.image || getNotificationImage(data.type),
    data: {
      ...data.data,
      notificationId: data.id,
      timestamp: Date.now(),
      url: data.url || '/',
      type: data.type,
      priority: data.priority,
      category: data.category
    },
    tag: data.tag || `notification-${data.type}-${data.id || Date.now()}`,
    requireInteraction: data.priority === 'high' || data.requireInteraction || false,
    silent: data.silent || (settings?.sound === false) || false,
    timestamp: data.timestamp || Date.now(),
    renotify: data.renotify || false,
    dir: 'auto', // Support RTL languages
    lang: 'en-US' // Default language
  };

  // Add custom vibration patterns based on priority and type
  if (settings?.vibration !== false && 'vibrate' in navigator) {
    baseOptions.vibrate = getVibrationPattern(data.type, data.priority);
  }

  // Add contextual actions based on notification type and user role
  baseOptions.actions = createContextualNotificationActions(data, settings);

  // Add custom styling for different notification types
  if (data.type === 'deadline_reminder' && data.priority === 'high') {
    baseOptions.requireInteraction = true;
  }

  return baseOptions;
}

// Get appropriate notification icon based on type and priority
function getNotificationIcon(type, priority) {
  const iconMap = {
    assignment_change: '/icons/assignment-icon-192.png',
    grade_update: '/icons/grade-icon-192.png',
    schedule_reminder: '/icons/calendar-icon-192.png',
    document_update: '/icons/document-icon-192.png',
    deadline_reminder: '/icons/deadline-icon-192.png',
    system_announcement: '/icons/system-icon-192.png',
    evaluation_request: '/icons/evaluation-icon-192.png',
    visit_scheduled: '/icons/visit-icon-192.png'
  };

  // Use priority-specific icons for high priority notifications
  if (priority === 'high') {
    return iconMap[type]?.replace('-icon-', '-urgent-icon-') || '/icons/urgent-notification-icon-192.png';
  }

  return iconMap[type] || '/icons/notification-icon-192.png';
}

// Get notification image for enhanced visual appeal
function getNotificationImage(type) {
  const imageMap = {
    assignment_change: '/images/assignment-banner.png',
    grade_update: '/images/grade-banner.png',
    schedule_reminder: '/images/calendar-banner.png',
    document_update: '/images/document-banner.png',
    deadline_reminder: '/images/deadline-banner.png',
    system_announcement: '/images/system-banner.png',
    evaluation_request: '/images/evaluation-banner.png',
    visit_scheduled: '/images/visit-banner.png'
  };

  return imageMap[type] || null;
}

// Get vibration pattern based on type and priority
function getVibrationPattern(type, priority) {
  const patterns = {
    high: {
      deadline_reminder: [300, 100, 300, 100, 300, 100, 300],
      assignment_change: [200, 100, 200, 100, 200],
      evaluation_request: [250, 150, 250],
      default: [200, 100, 200, 100, 200]
    },
    normal: {
      schedule_reminder: [150, 100, 150],
      document_update: [200, 100, 200],
      grade_update: [100, 50, 100, 50, 100],
      default: [200, 100, 200]
    },
    low: {
      system_announcement: [100],
      default: [100]
    }
  };

  const priorityPatterns = patterns[priority] || patterns.normal;
  return priorityPatterns[type] || priorityPatterns.default;
}

// Create contextual notification actions with enhanced UX
function createContextualNotificationActions(data, settings) {
  const actions = [];
  
  // Add primary action based on notification type and user context
  const primaryAction = getPrimaryAction(data);
  if (primaryAction) {
    actions.push(primaryAction);
  }

  // Add secondary action based on context
  const secondaryAction = getSecondaryAction(data, settings);
  if (secondaryAction) {
    actions.push(secondaryAction);
  }

  // Limit to 2 actions (browser limitation) and ensure proper icons
  return actions.slice(0, 2).map(action => ({
    ...action,
    icon: action.icon || '/icons/action-24.png'
  }));
}

// Get primary action based on notification type
function getPrimaryAction(data) {
  const primaryActions = {
    assignment_change: {
      action: 'accept',
      title: 'Accept Assignment',
      icon: '/icons/accept-24.png'
    },
    evaluation_request: {
      action: 'evaluate',
      title: 'Start Evaluation',
      icon: '/icons/evaluate-24.png'
    },
    document_update: {
      action: 'upload',
      title: 'Upload Document',
      icon: '/icons/upload-24.png'
    },
    schedule_reminder: {
      action: 'view-schedule',
      title: 'View Schedule',
      icon: '/icons/calendar-24.png'
    },
    grade_update: {
      action: 'view-grade',
      title: 'View Grade',
      icon: '/icons/grade-24.png'
    },
    deadline_reminder: {
      action: 'view-deadline',
      title: 'View Details',
      icon: '/icons/deadline-24.png'
    },
    visit_scheduled: {
      action: 'view-visit',
      title: 'View Visit',
      icon: '/icons/visit-24.png'
    },
    system_announcement: {
      action: 'view-announcement',
      title: 'Read More',
      icon: '/icons/announcement-24.png'
    }
  };

  return primaryActions[data.type] || {
    action: 'view',
    title: 'View',
    icon: '/icons/view-24.png'
  };
}

// Get secondary action based on context and settings
function getSecondaryAction(data, settings) {
  // For high priority notifications, always show dismiss
  if (data.priority === 'high') {
    return {
      action: 'dismiss',
      title: 'Dismiss',
      icon: '/icons/dismiss-24.png'
    };
  }

  // For reminders, offer snooze option
  if (data.type === 'deadline_reminder' || data.type === 'schedule_reminder') {
    return {
      action: 'snooze',
      title: 'Remind Later',
      icon: '/icons/snooze-24.png'
    };
  }

  // For evaluation requests, offer quick decline
  if (data.type === 'evaluation_request') {
    return {
      action: 'decline',
      title: 'Decline',
      icon: '/icons/decline-24.png'
    };
  }

  // Default secondary action
  return {
    action: 'mark-read',
    title: 'Mark Read',
    icon: '/icons/mark-read-24.png'
  };
}

// Handle notification grouping for similar notifications
function handleNotificationGrouping(newData, existingNotifications) {
  const sameTypeNotifications = existingNotifications.filter(
    notification => notification.data?.type === newData.type
  );

  if (sameTypeNotifications.length > 0) {
    // Close existing notifications of the same type
    sameTypeNotifications.forEach(notification => notification.close());

    // Create grouped notification
    const count = sameTypeNotifications.length + 1;
    return {
      title: `${count} ${getNotificationTypeLabel(newData.type)} notifications`,
      options: {
        body: `Latest: ${newData.body}`,
        icon: newData.icon || '/favicon.ico',
        badge: newData.badge || '/favicon.ico',
        tag: `grouped-${newData.type}`,
        data: {
          ...newData.data,
          isGrouped: true,
          count: count,
          type: newData.type,
        },
        actions: [
          { action: 'view-all', title: 'View All' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      }
    };
  }

  return null;
}

// Get user-friendly notification type labels
function getNotificationTypeLabel(type) {
  const labels = {
    assignment_change: 'Assignment',
    grade_update: 'Grade',
    schedule_reminder: 'Schedule',
    document_update: 'Document',
    deadline_reminder: 'Deadline',
    system_announcement: 'System',
    evaluation_request: 'Evaluation',
    visit_scheduled: 'Visit'
  };
  return labels[type] || 'General';
}

// Check if notification should be shown based on user settings
function shouldShowNotification(data, settings) {
  if (!settings) return true;

  // Check if push notifications are enabled
  if (settings.pushNotifications === false) return false;

  // Check if this notification type is enabled
  if (settings.types && settings.types[data.type] === false) return false;

  // Check quiet hours
  if (settings.quietHours?.enabled) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = parseTime(settings.quietHours.startTime);
    const endTime = parseTime(settings.quietHours.endTime);

    if (isInQuietHours(currentTime, startTime, endTime)) {
      return false;
    }
  }

  return true;
}

// Parse time string (HH:MM) to minutes
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if current time is in quiet hours
function isInQuietHours(currentTime, startTime, endTime) {
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

// Get notification settings from IndexedDB
async function getNotificationSettings() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('notificationSettings');
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return null;
  }
}

// Store notification data for offline access
async function storeNotificationData(data) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const notificationRecord = {
      id: data.id || `notification-${Date.now()}`,
      ...data,
      receivedAt: Date.now(),
      isRead: false,
    };
    
    store.put(notificationRecord);
  } catch (error) {
    console.error('Error storing notification data:', error);
  }
}

// Open IndexedDB for notifications with enhanced schema
function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      // Create notifications store
      if (!db.objectStoreNames.contains('notifications')) {
        const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notificationStore.createIndex('timestamp', 'receivedAt');
        notificationStore.createIndex('type', 'type');
        notificationStore.createIndex('isRead', 'isRead');
        notificationStore.createIndex('priority', 'priority');
        notificationStore.createIndex('category', 'category');
      }
      
      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      
      // Create pending actions store (version 2+)
      if (oldVersion < 2 && !db.objectStoreNames.contains('pendingActions')) {
        const actionsStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
        actionsStore.createIndex('timestamp', 'timestamp');
        actionsStore.createIndex('type', 'type');
      }
      
      // Create analytics store for notification metrics
      if (oldVersion < 2 && !db.objectStoreNames.contains('analytics')) {
        const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
        analyticsStore.createIndex('timestamp', 'timestamp');
        analyticsStore.createIndex('event', 'event');
      }
    };
  });
}

// Store pending action for offline sync with intelligent scheduling
async function storePendingAction(action) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    const actionRecord = {
      id: `action-${Date.now()}-${Math.random()}`,
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
      priority: action.priority || 'normal'
    };
    
    store.put(actionRecord);
    
    // Register appropriate background sync based on action priority
    await registerBackgroundSync(action.priority || 'normal');
    
  } catch (error) {
    console.error('Error storing pending action:', error);
  }
}

// Register background sync with intelligent scheduling
async function registerBackgroundSync(priority = 'normal') {
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      
      // Register different sync tags based on priority
      switch (priority) {
        case 'high':
          await registration.sync.register('notification-actions');
          break;
        case 'normal':
          await registration.sync.register('notification-actions');
          await registration.sync.register('notification-read-status');
          break;
        case 'low':
          await registration.sync.register('notification-settings');
          break;
      }
      
      // Register periodic sync for background fetching
      await registration.sync.register('periodic-notification-fetch');
    }
  } catch (error) {
    console.error('Error registering background sync:', error);
  }
}

// Initialize periodic background sync on service worker activation
async function initializePeriodicSync() {
  try {
    // Register periodic sync tags
    const registration = await self.registration;
    
    if ('sync' in registration) {
      // Register various sync operations
      await registration.sync.register('periodic-notification-fetch');
      await registration.sync.register('notification-analytics');
      await registration.sync.register('notification-cleanup');
      await registration.sync.register('user-activity-sync');
    }
    
    console.log('Periodic background sync initialized');
  } catch (error) {
    console.error('Error initializing periodic sync:', error);
  }
}

// Enhanced periodic sync with user activity awareness
async function scheduleIntelligentSync() {
  const userActivity = await getUserActivityData();
  const syncPreferences = await getSyncPreferences();
  
  // Determine optimal sync schedule based on user patterns
  const optimalSyncTimes = calculateOptimalSyncTimes(userActivity);
  
  // Store optimal sync schedule
  await updateSyncSchedule(optimalSyncTimes);
  
  console.log('Intelligent sync schedule updated:', optimalSyncTimes);
}

// Calculate optimal sync times based on user activity patterns
function calculateOptimalSyncTimes(userActivity) {
  const { preferredSyncTimes = [], averageSessionLength = 0 } = userActivity;
  
  // Default sync times if no user data available
  if (preferredSyncTimes.length === 0) {
    return [
      { hour: 9, minute: 0 },   // Morning
      { hour: 13, minute: 0 },  // Afternoon
      { hour: 17, minute: 0 },  // Evening
      { hour: 21, minute: 0 }   // Night
    ];
  }
  
  // Use user's preferred times with some intelligent adjustments
  return preferredSyncTimes.map(time => ({
    hour: time.hour,
    minute: time.minute,
    confidence: time.confidence || 0.5
  }));
}

// Update sync schedule in storage
async function updateSyncSchedule(schedule) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    store.put({
      key: 'syncSchedule',
      value: {
        schedule: schedule,
        updatedAt: Date.now()
      }
    });
  } catch (error) {
    console.error('Error updating sync schedule:', error);
  }
}

// Check if current time matches optimal sync schedule
async function shouldPerformScheduledSync() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('syncSchedule');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const scheduleData = request.result?.value;
        if (!scheduleData) {
          resolve(true); // Default to allowing sync
          return;
        }
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Check if current time is within 5 minutes of any scheduled sync time
        const isScheduledTime = scheduleData.schedule.some(time => {
          const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (time.hour * 60 + time.minute));
          return timeDiff <= 5; // Within 5 minutes
        });
        
        resolve(isScheduledTime);
      };
      request.onerror = () => resolve(true);
    });
  } catch (error) {
    console.error('Error checking sync schedule:', error);
    return true;
  }
}

// Store analytics event
async function storeAnalyticsEvent(event, data) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['analytics'], 'readwrite');
    const store = transaction.objectStore('analytics');
    
    const eventRecord = {
      id: `event-${Date.now()}-${Math.random()}`,
      event: event,
      data: data,
      timestamp: Date.now(),
    };
    
    store.put(eventRecord);
  } catch (error) {
    console.error('Error storing analytics event:', error);
  }
}

// Enhanced notification click handler with deep linking and analytics
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const notificationData = event.notification.data || {};
  const action = event.action || 'default';
  
  // Track notification interaction for analytics
  storeAnalyticsEvent('notification_clicked', {
    notificationId: notificationData.notificationId,
    action: action,
    type: notificationData.type,
    timestamp: Date.now()
  });
  
  // Close notification after tracking
  event.notification.close();
  
  event.waitUntil(handleEnhancedNotificationClick(action, notificationData));
});

// Handle notification click with enhanced routing and deep linking
async function handleEnhancedNotificationClick(action, notificationData) {
  // Mark notification as read in offline storage
  await markNotificationAsRead(notificationData.notificationId);
  
  // Handle different actions with enhanced logic
  switch (action) {
    case 'default':
    case 'view':
    case 'view-all':
      return handleViewAction(notificationData);
    
    case 'accept':
      return handleAcceptAction(notificationData);
    
    case 'evaluate':
    case 'start-evaluation':
      return handleEvaluateAction(notificationData);
    
    case 'upload':
      return handleUploadAction(notificationData);
    
    case 'view-schedule':
      return handleScheduleAction(notificationData);
    
    case 'view-grade':
      return handleGradeAction(notificationData);
    
    case 'view-deadline':
      return handleDeadlineAction(notificationData);
    
    case 'view-visit':
      return handleVisitAction(notificationData);
    
    case 'view-announcement':
      return handleAnnouncementAction(notificationData);
    
    case 'snooze':
      return handleSnoozeAction(notificationData);
    
    case 'decline':
      return handleDeclineAction(notificationData);
    
    case 'mark-read':
      return handleMarkReadAction(notificationData);
    
    case 'dismiss':
      return handleDismissAction(notificationData);
    
    default:
      // Default action - open notification center
      return handleDefaultAction(notificationData);
  }
}

// Handle view action with smart routing
async function handleViewAction(notificationData) {
  const targetUrl = getNotificationTargetUrl('view', notificationData);
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true
  });
}

// Handle accept action for assignments
async function handleAcceptAction(notificationData) {
  // Store pending action for offline sync
  await storePendingAction({
    type: 'accept_assignment',
    notificationId: notificationData.notificationId,
    data: notificationData
  });
  
  // Open assignment page with accept context
  const targetUrl = getNotificationTargetUrl('accept', notificationData);
  return openNotificationTarget(targetUrl + '?action=accept', notificationData, {
    focus: true,
    navigate: true,
    context: 'accept'
  });
}

// Handle evaluate action
async function handleEvaluateAction(notificationData) {
  const targetUrl = getNotificationTargetUrl('evaluate', notificationData);
  return openNotificationTarget(targetUrl + '?action=evaluate', notificationData, {
    focus: true,
    navigate: true,
    context: 'evaluate'
  });
}

// Handle upload action
async function handleUploadAction(notificationData) {
  const targetUrl = '/documents/upload';
  const urlWithContext = `${targetUrl}?notification=${notificationData.notificationId}&type=${notificationData.type}`;
  
  return openNotificationTarget(urlWithContext, notificationData, {
    focus: true,
    navigate: true,
    context: 'upload'
  });
}

// Handle schedule action
async function handleScheduleAction(notificationData) {
  const targetUrl = getNotificationTargetUrl('schedule', notificationData);
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true,
    context: 'schedule'
  });
}

// Handle grade action
async function handleGradeAction(notificationData) {
  const targetUrl = getNotificationTargetUrl('grade', notificationData);
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true,
    context: 'grade'
  });
}

// Handle deadline action
async function handleDeadlineAction(notificationData) {
  const targetUrl = getNotificationTargetUrl('deadline', notificationData);
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true,
    context: 'deadline'
  });
}

// Handle visit action
async function handleVisitAction(notificationData) {
  const targetUrl = getNotificationTargetUrl('visit', notificationData);
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true,
    context: 'visit'
  });
}

// Handle announcement action
async function handleAnnouncementAction(notificationData) {
  const targetUrl = `/notifications?notification=${notificationData.notificationId}&type=system_announcement`;
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true,
    context: 'announcement'
  });
}

// Handle snooze action
async function handleSnoozeAction(notificationData) {
  // Store snooze action for later processing
  await storePendingAction({
    type: 'snooze_notification',
    notificationId: notificationData.notificationId,
    snoozeUntil: Date.now() + (15 * 60 * 1000), // 15 minutes
    data: notificationData
  });
  
  // Show confirmation
  await self.registration.showNotification('Reminder Snoozed', {
    body: 'You will be reminded again in 15 minutes',
    icon: '/icons/snooze-icon-192.png',
    tag: 'snooze-confirmation',
    requireInteraction: false,
    silent: true,
    actions: []
  });
  
  return Promise.resolve();
}

// Handle decline action
async function handleDeclineAction(notificationData) {
  // Store decline action for offline sync
  await storePendingAction({
    type: 'decline_evaluation',
    notificationId: notificationData.notificationId,
    data: notificationData
  });
  
  // Show confirmation
  await self.registration.showNotification('Evaluation Declined', {
    body: 'The evaluation request has been declined',
    icon: '/icons/decline-icon-192.png',
    tag: 'decline-confirmation',
    requireInteraction: false,
    silent: true,
    actions: []
  });
  
  return Promise.resolve();
}

// Handle mark as read action
async function handleMarkReadAction(notificationData) {
  // Already marked as read in the main handler
  // Just show confirmation if needed
  return Promise.resolve();
}

// Handle dismiss action
async function handleDismissAction(notificationData) {
  await trackNotificationDismissal(notificationData);
  return Promise.resolve();
}

// Handle default action
async function handleDefaultAction(notificationData) {
  const targetUrl = '/notifications';
  return openNotificationTarget(targetUrl, notificationData, {
    focus: true,
    navigate: true
  });
}

// Get target URL based on notification type, action, and data with deep linking
function getNotificationTargetUrl(action, notificationData) {
  const baseUrl = notificationData.url || '/';
  const notificationId = notificationData.notificationId;
  
  // Handle grouped notifications
  if (notificationData.isGrouped) {
    return `/notifications?type=${notificationData.type}&grouped=true`;
  }
  
  // Handle action-specific URLs
  const actionUrls = getActionSpecificUrls(action, notificationData);
  if (actionUrls) {
    return actionUrls;
  }
  
  // Handle specific notification types with enhanced deep linking
  switch (notificationData.type) {
    case 'assignment_change':
      return `/instructor/assign-visitor?notification=${notificationId}&highlight=assignment`;
    
    case 'grade_update':
      return `/instructor/assign-grade?notification=${notificationId}&highlight=grade`;
    
    case 'evaluation_request':
      return `/evaluate/company?notification=${notificationId}&highlight=evaluation`;
    
    case 'document_update':
      return `/documents?notification=${notificationId}&highlight=document&required=true`;
    
    case 'schedule_reminder':
      return `/visitor?notification=${notificationId}&highlight=schedule&date=${notificationData.scheduleDate || ''}`;
    
    case 'deadline_reminder':
      return `/dashboard?notification=${notificationId}&highlight=deadline&urgent=true`;
    
    case 'system_announcement':
      return `/notifications?notification=${notificationId}&type=system&highlight=announcement`;
    
    case 'visit_scheduled':
      return `/visitor?notification=${notificationId}&highlight=visit&visit=${notificationData.visitId || ''}`;
    
    default:
      return `${baseUrl}?notification=${notificationId}`;
  }
}

// Get action-specific URLs for enhanced deep linking
function getActionSpecificUrls(action, notificationData) {
  const notificationId = notificationData.notificationId;
  
  switch (action) {
    case 'accept':
      return `/instructor/assign-visitor?notification=${notificationId}&action=accept&auto=true`;
    
    case 'evaluate':
    case 'start-evaluation':
      return `/evaluate/company?notification=${notificationId}&action=start&auto=true`;
    
    case 'upload':
      return `/documents/upload?notification=${notificationId}&type=${notificationData.documentType || 'general'}`;
    
    case 'schedule':
    case 'view-schedule':
      return `/visitor?notification=${notificationId}&view=schedule&date=${notificationData.scheduleDate || ''}`;
    
    case 'grade':
    case 'view-grade':
      return `/instructor/assign-grade?notification=${notificationId}&view=grade&student=${notificationData.studentId || ''}`;
    
    case 'deadline':
    case 'view-deadline':
      return `/dashboard?notification=${notificationId}&view=deadline&task=${notificationData.taskId || ''}`;
    
    case 'visit':
    case 'view-visit':
      return `/visitor?notification=${notificationId}&view=visit&visit=${notificationData.visitId || ''}`;
    
    case 'announcement':
    case 'view-announcement':
      return `/notifications?notification=${notificationId}&type=system&view=announcement`;
    
    default:
      return null;
  }
}

// Open notification target with enhanced window management and client focus
async function openNotificationTarget(url, notificationData, options = {}) {
  const { focus = true, navigate = true, context = null } = options;
  
  const clients = await self.clients.matchAll({ 
    type: 'window', 
    includeUncontrolled: true 
  });
  
  // Try to find the best existing client
  const bestClient = findBestClient(clients, url, notificationData);
  
  if (bestClient) {
    // Focus existing window
    if (focus) {
      await bestClient.focus();
    }
    
    // Send enhanced navigation message
    bestClient.postMessage({
      type: 'NOTIFICATION_CLICK',
      url: url,
      notificationData: notificationData,
      context: context,
      navigate: navigate,
      timestamp: Date.now(),
      action: 'navigate'
    });
    
    // Track successful client reuse
    await storeAnalyticsEvent('notification_client_reused', {
      notificationId: notificationData.notificationId,
      clientUrl: bestClient.url,
      targetUrl: url
    });
    
    return bestClient;
  }
  
  // No suitable existing window found, open a new one
  if (self.clients.openWindow) {
    const newClient = await self.clients.openWindow(url);
    
    // Track new window opening
    await storeAnalyticsEvent('notification_new_window', {
      notificationId: notificationData.notificationId,
      targetUrl: url
    });
    
    return newClient;
  }
  
  // Fallback - try to message any available client
  if (clients.length > 0) {
    const fallbackClient = clients[0];
    await fallbackClient.focus();
    
    fallbackClient.postMessage({
      type: 'NOTIFICATION_FALLBACK',
      url: url,
      notificationData: notificationData,
      context: context,
      message: 'Please navigate to the notification target'
    });
    
    return fallbackClient;
  }
}

// Find the best existing client for the notification
function findBestClient(clients, targetUrl, notificationData) {
  if (clients.length === 0) return null;
  
  // Priority 1: Client already on the target page or similar
  const exactMatch = clients.find(client => 
    client.url.includes(targetUrl.split('?')[0])
  );
  if (exactMatch) return exactMatch;
  
  // Priority 2: Client on the same domain
  const sameOrigin = clients.find(client => 
    client.url.includes(self.location.origin)
  );
  if (sameOrigin) return sameOrigin;
  
  // Priority 3: Any visible client
  const visibleClient = clients.find(client => 
    client.visibilityState === 'visible'
  );
  if (visibleClient) return visibleClient;
  
  // Priority 4: Most recently focused client
  return clients.reduce((best, current) => {
    if (!best) return current;
    return current.lastFocusedAt > best.lastFocusedAt ? current : best;
  });
}

// Enhanced client communication for notification actions
async function sendMessageToClients(message, targetClients = null) {
  const clients = targetClients || await self.clients.matchAll({ type: 'window' });
  
  const promises = clients.map(client => {
    return new Promise((resolve) => {
      client.postMessage(message);
      resolve();
    });
  });
  
  return Promise.all(promises);
}

// Handle client responses to notification actions
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data.type) {
    case 'NOTIFICATION_ACTION_RESPONSE':
      handleNotificationActionResponse(data);
      break;
    
    case 'CLIENT_READY':
      handleClientReady(event.source, data);
      break;
    
    case 'NOTIFICATION_VIEWED':
      handleNotificationViewed(data);
      break;
    
    case 'CLIENT_NAVIGATION_COMPLETE':
      handleClientNavigationComplete(data);
      break;
    
    default:
      console.log('Unknown message type:', data.type);
  }
});

// Handle notification action responses from clients
async function handleNotificationActionResponse(data) {
  const { notificationId, action, success, error } = data;
  
  if (success) {
    await storeAnalyticsEvent('notification_action_success', {
      notificationId: notificationId,
      action: action,
      timestamp: Date.now()
    });
  } else {
    await storeAnalyticsEvent('notification_action_error', {
      notificationId: notificationId,
      action: action,
      error: error,
      timestamp: Date.now()
    });
  }
}

// Handle client ready state
async function handleClientReady(client, data) {
  // Send any pending notifications or updates to the ready client
  const pendingNotifications = await getPendingNotificationsForClient();
  
  if (pendingNotifications.length > 0) {
    client.postMessage({
      type: 'PENDING_NOTIFICATIONS',
      notifications: pendingNotifications
    });
  }
}

// Handle notification viewed confirmation
async function handleNotificationViewed(data) {
  const { notificationId } = data;
  
  await markNotificationAsRead(notificationId);
  await storeAnalyticsEvent('notification_viewed', {
    notificationId: notificationId,
    timestamp: Date.now()
  });
}

// Handle client navigation completion
async function handleClientNavigationComplete(data) {
  const { notificationId, url, success } = data;
  
  await storeAnalyticsEvent('notification_navigation_complete', {
    notificationId: notificationId,
    url: url,
    success: success,
    timestamp: Date.now()
  });
}

// Get pending notifications for a client
async function getPendingNotificationsForClient() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const index = store.index('isRead');
    
    return new Promise((resolve) => {
      const request = index.getAll(false); // Get unread notifications
      request.onsuccess = () => {
        const notifications = request.result || [];
        resolve(notifications.slice(0, 10)); // Limit to 10 most recent
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

// Handle specific notification actions
async function handleNotificationAction(action, notificationData) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // Send action to existing client
  if (clients.length > 0) {
    clients[0].postMessage({
      type: 'NOTIFICATION_ACTION',
      action: action,
      notificationData: notificationData
    });
    
    return clients[0].focus();
  }
  
  // No client available, open new window with action
  const url = getNotificationTargetUrl(action, notificationData) + `?action=${action}`;
  return self.clients.openWindow(url);
}

// Mark notification as read in offline storage
async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;
  
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.get(notificationId);
    request.onsuccess = () => {
      const notification = request.result;
      if (notification) {
        notification.isRead = true;
        notification.readAt = Date.now();
        store.put(notification);
      }
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Track notification dismissal
async function trackNotificationDismissal(notificationData) {
  try {
    // Store dismissal data for analytics
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.get(notificationData.notificationId);
    request.onsuccess = () => {
      const notification = request.result;
      if (notification) {
        notification.isDismissed = true;
        notification.dismissedAt = Date.now();
        store.put(notification);
      }
    };
  } catch (error) {
    console.error('Error tracking notification dismissal:', error);
  }
}

// Enhanced notification close handler with cleanup and analytics
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  const notificationData = event.notification.data || {};
  const notificationId = notificationData.notificationId;
  
  // Always track notification dismissal for analytics
  event.waitUntil(handleNotificationClose(notificationData));
});

// Handle notification close with enhanced cleanup
async function handleNotificationClose(notificationData) {
  const notificationId = notificationData.notificationId;
  
  // Track dismissal analytics
  await storeAnalyticsEvent('notification_dismissed', {
    notificationId: notificationId,
    type: notificationData.type,
    priority: notificationData.priority,
    timestamp: Date.now(),
    timeVisible: Date.now() - (notificationData.timestamp || Date.now())
  });
  
  // Update notification status in offline storage
  await updateNotificationDismissalStatus(notificationId);
  
  // Clean up any related notifications if this was a grouped notification
  if (notificationData.isGrouped) {
    await cleanupGroupedNotifications(notificationData.type);
  }
  
  // Notify clients about the dismissal
  await sendMessageToClients({
    type: 'NOTIFICATION_DISMISSED',
    notificationId: notificationId,
    timestamp: Date.now()
  });
}

// Update notification dismissal status in storage
async function updateNotificationDismissalStatus(notificationId) {
  if (!notificationId) return;
  
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.get(notificationId);
    request.onsuccess = () => {
      const notification = request.result;
      if (notification) {
        notification.isDismissed = true;
        notification.dismissedAt = Date.now();
        notification.isRead = true; // Mark as read when dismissed
        notification.readAt = notification.readAt || Date.now();
        store.put(notification);
      }
    };
  } catch (error) {
    console.error('Error updating notification dismissal status:', error);
  }
}

// Clean up grouped notifications
async function cleanupGroupedNotifications(type) {
  try {
    // Get all notifications of the same type that might be grouped
    const existingNotifications = await self.registration.getNotifications({
      tag: `grouped-${type}`
    });
    
    // Close any remaining grouped notifications
    existingNotifications.forEach(notification => {
      if (notification.tag === `grouped-${type}`) {
        notification.close();
      }
    });
  } catch (error) {
    console.error('Error cleaning up grouped notifications:', error);
  }
}

// Periodic cleanup of old notifications
async function performNotificationCleanup() {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const index = store.index('timestamp');
    
    // Clean up notifications older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const range = IDBKeyRange.upperBound(thirtyDaysAgo);
    
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    // Clean up old analytics data (keep only 7 days)
    const analyticsTransaction = db.transaction(['analytics'], 'readwrite');
    const analyticsStore = analyticsTransaction.objectStore('analytics');
    const analyticsIndex = analyticsStore.index('timestamp');
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const analyticsRange = IDBKeyRange.upperBound(sevenDaysAgo);
    
    const analyticsRequest = analyticsIndex.openCursor(analyticsRange);
    analyticsRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
  } catch (error) {
    console.error('Error performing notification cleanup:', error);
  }
}