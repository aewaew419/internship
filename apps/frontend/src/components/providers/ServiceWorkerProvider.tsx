'use client';

import { useEffect } from 'react';
import { ServiceWorkerManager } from '@/lib/serviceWorker';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV === 'production') {
      const swManager = ServiceWorkerManager.getInstance();
      
      // Register service worker
      swManager.register().then((registration) => {
        if (registration) {
          console.log('Service Worker registered successfully');
          
          // Request notification permission if supported
          swManager.requestNotificationPermission().then((permission) => {
            console.log('Notification permission:', permission);
          });
        }
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }

    // Handle online/offline status
    const handleOnline = () => {
      console.log('App is online');
      // Sync any pending data
    };

    const handleOffline = () => {
      console.log('App is offline');
      // Show offline indicator
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}