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

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
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

// Enhanced background sync for offline notification actions
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
    default:
      event.waitUntil(doBackgroundSync());
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

// General background sync
async function doBackgroundSync() {
  console.log('General background sync triggered');
  
  // Sync all notification-related data
  await Promise.all([
    syncNotificationActions(),
    syncNotificationReadStatus(),
    syncNotificationSettings(),
  ]);
}

// Enhanced push notification handling
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push notification data:', data);
      
      event.waitUntil(handlePushNotification(data));
    } catch (error) {
      console.error('Error processing push notification:', error);
      
      // Fallback notification
      event.waitUntil(
        self.registration.showNotification('New Notification', {
          body: 'You have a new notification',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'fallback'
        })
      );
    }
  }
});

// Enhanced push notification handler
async function handlePushNotification(data) {
  // Check if user has notification settings stored
  const settings = await getNotificationSettings();
  
  // Apply user preferences
  if (!shouldShowNotification(data, settings)) {
    console.log('Notification filtered by user settings');
    return;
  }
  
  // Get existing notifications to handle grouping
  const existingNotifications = await self.registration.getNotifications();
  
  // Handle notification grouping
  const groupedNotification = handleNotificationGrouping(data, existingNotifications);
  if (groupedNotification) {
    return self.registration.showNotification(groupedNotification.title, groupedNotification.options);
  }
  
  // Create notification options with enhanced features
  const options = createNotificationOptions(data, settings);
  
  // Store notification data for offline access
  await storeNotificationData(data);
  
  // Show the notification
  return self.registration.showNotification(data.title || 'Notification', options);
}

// Create enhanced notification options
function createNotificationOptions(data, settings) {
  const baseOptions = {
    body: data.body || 'New notification',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image,
    data: {
      ...data.data,
      notificationId: data.id,
      timestamp: Date.now(),
      url: data.url || '/',
    },
    tag: data.tag || `notification-${data.id || Date.now()}`,
    requireInteraction: data.priority === 'high' || data.requireInteraction || false,
    silent: data.silent || (settings?.sound === false) || false,
    timestamp: data.timestamp || Date.now(),
    renotify: data.renotify || false,
  };

  // Add vibration pattern based on priority and settings
  if (settings?.vibration !== false && 'vibrate' in navigator) {
    const vibrationPatterns = {
      high: [200, 100, 200, 100, 200],
      normal: [200, 100, 200],
      low: [100],
    };
    baseOptions.vibrate = data.vibrate || vibrationPatterns[data.priority] || vibrationPatterns.normal;
  }

  // Add actions based on notification type
  baseOptions.actions = createNotificationActions(data);

  return baseOptions;
}

// Create context-aware notification actions
function createNotificationActions(data) {
  const actions = [];
  
  // Add default actions
  actions.push({
    action: 'view',
    title: 'View',
    icon: '/icons/view.png'
  });

  // Add type-specific actions
  switch (data.type) {
    case 'assignment_change':
      actions.push({
        action: 'accept',
        title: 'Accept',
        icon: '/icons/accept.png'
      });
      break;
    case 'evaluation_request':
      actions.push({
        action: 'evaluate',
        title: 'Evaluate',
        icon: '/icons/evaluate.png'
      });
      break;
    case 'document_update':
      actions.push({
        action: 'upload',
        title: 'Upload',
        icon: '/icons/upload.png'
      });
      break;
    case 'schedule_reminder':
      actions.push({
        action: 'schedule',
        title: 'View Schedule',
        icon: '/icons/calendar.png'
      });
      break;
  }

  // Add dismiss action
  actions.push({
    action: 'dismiss',
    title: 'Dismiss',
    icon: '/icons/dismiss.png'
  });

  // Limit to 2 actions (browser limitation)
  return actions.slice(0, 2);
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

// Store pending action for offline sync
async function storePendingAction(action) {
  try {
    const db = await openNotificationDB();
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    const actionRecord = {
      id: `action-${Date.now()}-${Math.random()}`,
      ...action,
      timestamp: Date.now(),
    };
    
    store.put(actionRecord);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('notification-actions');
    }
  } catch (error) {
    console.error('Error storing pending action:', error);
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

// Enhanced notification click handler with deep linking
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  
  event.waitUntil(handleNotificationClick(event.action, notificationData));
});

// Handle notification click with enhanced routing
async function handleNotificationClick(action, notificationData) {
  // Mark notification as read in offline storage
  await markNotificationAsRead(notificationData.notificationId);
  
  // Determine target URL based on action and notification data
  const targetUrl = getNotificationTargetUrl(action, notificationData);
  
  // Handle different actions
  switch (action) {
    case 'view':
    case 'view-all':
      return openNotificationTarget(targetUrl, notificationData);
    
    case 'accept':
      return handleNotificationAction('accept', notificationData);
    
    case 'evaluate':
      return openNotificationTarget(targetUrl + '?action=evaluate', notificationData);
    
    case 'upload':
      return openNotificationTarget('/documents/upload', notificationData);
    
    case 'schedule':
      return openNotificationTarget('/schedule', notificationData);
    
    case 'dismiss':
      // Just track the dismissal
      return trackNotificationDismissal(notificationData);
    
    default:
      // Default click action - open the notification target
      return openNotificationTarget(targetUrl, notificationData);
  }
}

// Get target URL based on notification type and data
function getNotificationTargetUrl(action, notificationData) {
  const baseUrl = notificationData.url || '/';
  
  // Handle grouped notifications
  if (notificationData.isGrouped) {
    return `/notifications?type=${notificationData.type}`;
  }
  
  // Handle specific notification types
  switch (notificationData.type) {
    case 'assignment_change':
      return `/instructor/assign-visitor?notification=${notificationData.notificationId}`;
    
    case 'grade_update':
      return `/instructor/assign-grade?notification=${notificationData.notificationId}`;
    
    case 'evaluation_request':
      return `/evaluate/company?notification=${notificationData.notificationId}`;
    
    case 'document_update':
      return `/documents?notification=${notificationData.notificationId}`;
    
    case 'schedule_reminder':
      return `/visitor?notification=${notificationData.notificationId}`;
    
    case 'deadline_reminder':
      return `/dashboard?notification=${notificationData.notificationId}`;
    
    case 'system_announcement':
      return `/notifications?notification=${notificationData.notificationId}`;
    
    case 'visit_scheduled':
      return `/visitor?notification=${notificationData.notificationId}`;
    
    default:
      return baseUrl;
  }
}

// Open notification target with smart window management
async function openNotificationTarget(url, notificationData) {
  const clients = await self.clients.matchAll({ 
    type: 'window', 
    includeUncontrolled: true 
  });
  
  // Try to find an existing client with the app
  for (const client of clients) {
    if (client.url.includes(self.location.origin)) {
      // Focus existing window and navigate
      await client.focus();
      
      // Send message to navigate to the target URL
      client.postMessage({
        type: 'NOTIFICATION_CLICK',
        url: url,
        notificationData: notificationData
      });
      
      return;
    }
  }
  
  // No existing window found, open a new one
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
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

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissal if needed
  const notificationData = event.notification.data || {};
  if (notificationData.trackDismissal) {
    // Could send analytics data here
    console.log('Notification dismissed:', notificationData);
  }
});