'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { featureDetection, type FeatureDetectionResult } from '../../../lib/push-notifications/feature-detection';
import { browserCompatibility } from '../../../lib/push-notifications/browser-compatibility';
import { polyfillManager } from '../../../lib/push-notifications/polyfills';

interface ProgressiveEnhancementState {
  detectionResult: FeatureDetectionResult | null;
  isLoading: boolean;
  error: string | null;
  enhancementLevel: 'baseline' | 'enhanced' | 'premium';
  availableFeatures: string[];
  unavailableFeatures: string[];
  fallbackMethods: string[];
}

interface ProgressiveEnhancementActions {
  refreshDetection: () => Promise<void>;
  getCapabilityReport: () => { summary: string; details: string[]; actions: string[] } | null;
  getSetupInstructions: () => string[];
  canUseFeature: (feature: string) => boolean;
  getFeatureAlternative: (feature: string) => string | null;
}

interface ProgressiveEnhancementContextType extends ProgressiveEnhancementState, ProgressiveEnhancementActions {}

const ProgressiveEnhancementContext = createContext<ProgressiveEnhancementContextType | null>(null);

export function useProgressiveEnhancement() {
  const context = useContext(ProgressiveEnhancementContext);
  if (!context) {
    throw new Error('useProgressiveEnhancement must be used within ProgressiveNotificationProvider');
  }
  return context;
}

interface ProgressiveNotificationProviderProps {
  children: React.ReactNode;
  enableAutoDetection?: boolean;
  showCapabilityWarnings?: boolean;
}

export function ProgressiveNotificationProvider({
  children,
  enableAutoDetection = true,
  showCapabilityWarnings = true
}: ProgressiveNotificationProviderProps) {
  const [state, setState] = useState<ProgressiveEnhancementState>({
    detectionResult: null,
    isLoading: false,
    error: null,
    enhancementLevel: 'baseline',
    availableFeatures: [],
    unavailableFeatures: [],
    fallbackMethods: []
  });

  const updateState = useCallback((updates: Partial<ProgressiveEnhancementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Perform feature detection and determine enhancement level
   */
  const performDetection = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      // Initialize polyfills
      polyfillManager.initialize();

      // Perform feature detection
      const detectionResult = await featureDetection.detectFeatures();
      
      // Determine enhancement level
      const strategy = featureDetection.getProgressiveEnhancementStrategy();
      let enhancementLevel: 'baseline' | 'enhanced' | 'premium' = 'baseline';
      
      if (strategy.premium.length > 0 && detectionResult.isSupported) {
        enhancementLevel = 'premium';
      } else if (strategy.enhanced.length > 0) {
        enhancementLevel = 'enhanced';
      }

      // Categorize features
      const availableFeatures: string[] = [];
      const unavailableFeatures: string[] = [];
      
      Object.entries(detectionResult.features).forEach(([feature, isAvailable]) => {
        if (isAvailable) {
          availableFeatures.push(feature);
        } else {
          unavailableFeatures.push(feature);
        }
      });

      // Get fallback methods
      const fallbackMethods = detectionResult.fallbackOptions
        .filter(option => option.isAvailable)
        .map(option => option.name);

      updateState({
        detectionResult,
        enhancementLevel,
        availableFeatures,
        unavailableFeatures,
        fallbackMethods,
        isLoading: false,
        error: null
      });

      // Show capability warnings if enabled
      if (showCapabilityWarnings && detectionResult.limitations.length > 0) {
        console.warn('Notification capability limitations detected:', detectionResult.limitations);
      }

      console.log('Progressive enhancement detection completed:', {
        level: enhancementLevel,
        available: availableFeatures.length,
        unavailable: unavailableFeatures.length,
        fallbacks: fallbackMethods.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Feature detection failed';
      updateState({ 
        error: errorMessage, 
        isLoading: false,
        enhancementLevel: 'baseline'
      });
      console.error('Progressive enhancement detection failed:', error);
    }
  }, [updateState, showCapabilityWarnings]);

  /**
   * Refresh feature detection
   */
  const refreshDetection = useCallback(async () => {
    await performDetection();
  }, [performDetection]);

  /**
   * Get capability report
   */
  const getCapabilityReport = useCallback(() => {
    if (!state.detectionResult) {
      return null;
    }
    return featureDetection.generateCapabilityReport();
  }, [state.detectionResult]);

  /**
   * Get setup instructions
   */
  const getSetupInstructions = useCallback(() => {
    return browserCompatibility.getSetupInstructions();
  }, []);

  /**
   * Check if a feature can be used
   */
  const canUseFeature = useCallback((feature: string) => {
    if (!state.detectionResult) {
      return false;
    }
    
    const featureKey = feature as keyof typeof state.detectionResult.features;
    return state.detectionResult.features[featureKey] || false;
  }, [state.detectionResult]);

  /**
   * Get alternative for unavailable feature
   */
  const getFeatureAlternative = useCallback((feature: string): string | null => {
    if (!state.detectionResult) {
      return null;
    }

    // Map features to their alternatives
    const alternatives: Record<string, string> = {
      pushNotifications: 'Server-Sent Events or WebSocket',
      actionButtons: 'Click-to-navigate only',
      badgeSupport: 'Text-based unread count',
      backgroundSync: 'Manual refresh required',
      silentNotifications: 'All notifications will be visible',
      persistentNotifications: 'Notifications may auto-dismiss',
      vibrationAPI: 'Visual notifications only',
      indexedDB: 'Limited offline storage with localStorage'
    };

    return alternatives[feature] || 'Manual alternative required';
  }, [state.detectionResult]);

  // Initialize detection on mount
  useEffect(() => {
    if (enableAutoDetection && typeof window !== 'undefined') {
      performDetection();
    }
  }, [enableAutoDetection, performDetection]);

  // Re-detect on visibility change (user might have changed browser settings)
  useEffect(() => {
    if (!enableAutoDetection) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Delay to allow browser to settle
        setTimeout(() => {
          performDetection();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableAutoDetection, performDetection]);

  // Re-detect on online status change
  useEffect(() => {
    if (!enableAutoDetection) return;

    const handleOnline = () => {
      setTimeout(() => {
        performDetection();
      }, 500);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enableAutoDetection, performDetection]);

  const contextValue: ProgressiveEnhancementContextType = {
    ...state,
    refreshDetection,
    getCapabilityReport,
    getSetupInstructions,
    canUseFeature,
    getFeatureAlternative
  };

  return (
    <ProgressiveEnhancementContext.Provider value={contextValue}>
      {children}
    </ProgressiveEnhancementContext.Provider>
  );
}