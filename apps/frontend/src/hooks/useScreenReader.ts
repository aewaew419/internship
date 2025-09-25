import { useCallback, useRef } from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

interface ScreenReaderOptions {
  defaultPriority?: AnnouncementPriority;
  debounceTime?: number;
}

export const useScreenReader = ({
  defaultPriority = 'polite',
  debounceTime = 100,
}: ScreenReaderOptions = {}) => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create or get the live region element
  const getLiveRegion = useCallback((priority: AnnouncementPriority) => {
    const id = `sr-live-region-${priority}`;
    let liveRegion = document.getElementById(id) as HTMLDivElement;
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
  }, []);

  const announce = useCallback((
    message: string,
    priority: AnnouncementPriority = defaultPriority
  ) => {
    if (!message.trim()) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce announcements
    timeoutRef.current = setTimeout(() => {
      const liveRegion = getLiveRegion(priority);
      
      // Clear the region first to ensure the announcement is heard
      liveRegion.textContent = '';
      
      // Use a small delay to ensure the clearing is processed
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 10);
    }, debounceTime);
  }, [defaultPriority, debounceTime, getLiveRegion]);

  const announceError = useCallback((message: string) => {
    announce(`ข้อผิดพลาด: ${message}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`สำเร็จ: ${message}`, 'polite');
  }, [announce]);

  const announceStatus = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceWarning = useCallback((message: string) => {
    announce(`คำเตือน: ${message}`, 'assertive');
  }, [announce]);

  const announceNavigation = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceFormValidation = useCallback((fieldName: string, message: string, isValid: boolean) => {
    const prefix = isValid ? 'ถูกต้อง' : 'ไม่ถูกต้อง';
    announce(`${fieldName} ${prefix}: ${message}`, isValid ? 'polite' : 'assertive');
  }, [announce]);

  const announceProgress = useCallback((current: number, total: number, description?: string) => {
    const percentage = Math.round((current / total) * 100);
    const message = description 
      ? `${description} ${percentage}% เสร็จสิ้น`
      : `ความคืบหน้า ${percentage}%`;
    announce(message, 'polite');
  }, [announce]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Clear both live regions
    ['polite', 'assertive'].forEach(priority => {
      const liveRegion = document.getElementById(`sr-live-region-${priority}`);
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    });
  }, []);

  return {
    announce,
    announceError,
    announceSuccess,
    announceStatus,
    announceWarning,
    announceNavigation,
    announceFormValidation,
    announceProgress,
    clear,
  };
};