'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  abTestManager,
  ABTest,
  ABTestVariant,
  ABTestAnalysis,
  createABTest,
  startABTest,
  getVariantForUser,
  getTestAnalysis
} from '../lib/notifications/ab-testing';
import { Notification } from '../types/notifications';

export interface UseABTestingReturn {
  // Test management
  createTest: (config: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => ABTest;
  startTest: (testId: string) => boolean;
  stopTest: (testId: string, reason?: string) => boolean;
  updateTest: (testId: string, updates: Partial<ABTest>) => boolean;
  
  // Test execution
  getVariantForUser: (userId: number, testId: string) => ABTestVariant | null;
  applyVariantToNotification: (notification: Notification, variant: ABTestVariant) => Notification;
  shouldSendNotification: (userId: number, testId: string, notification: Notification) => boolean;
  recordTestEvent: (userId: number, testId: string, eventType: string, metadata?: Record<string, any>) => void;
  
  // Test analysis
  getTestAnalysis: (testId: string) => ABTestAnalysis | null;
  getActiveTests: () => ABTest[];
  getTest: (testId: string) => ABTest | null;
  
  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for A/B testing functionality
 */
export function useABTesting(): UseABTestingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTest = useCallback((config: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      setError(null);
      return createABTest(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create test';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const handleStartTest = useCallback((testId: string) => {
    try {
      setError(null);
      return startABTest(testId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start test';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const handleStopTest = useCallback((testId: string, reason?: string) => {
    try {
      setError(null);
      return abTestManager.stopTest(testId, reason);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop test';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const handleUpdateTest = useCallback((testId: string, updates: Partial<ABTest>) => {
    try {
      setError(null);
      return abTestManager.updateTest(testId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update test';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const handleGetVariantForUser = useCallback((userId: number, testId: string) => {
    try {
      setError(null);
      return getVariantForUser(userId, testId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get variant';
      setError(errorMessage);
      return null;
    }
  }, []);

  const handleApplyVariantToNotification = useCallback((notification: Notification, variant: ABTestVariant) => {
    try {
      setError(null);
      return abTestManager.applyVariantToNotification(notification, variant);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply variant';
      setError(errorMessage);
      return notification;
    }
  }, []);

  const handleShouldSendNotification = useCallback((userId: number, testId: string, notification: Notification) => {
    try {
      setError(null);
      return abTestManager.shouldSendNotification(userId, testId, notification);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check send conditions';
      setError(errorMessage);
      return true; // Default to sending if check fails
    }
  }, []);

  const handleRecordTestEvent = useCallback((userId: number, testId: string, eventType: string, metadata?: Record<string, any>) => {
    try {
      setError(null);
      abTestManager.recordTestEvent(userId, testId, eventType, metadata);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record test event';
      setError(errorMessage);
      console.error(errorMessage, err);
    }
  }, []);

  const handleGetTestAnalysis = useCallback((testId: string) => {
    try {
      setError(null);
      return getTestAnalysis(testId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get test analysis';
      setError(errorMessage);
      return null;
    }
  }, []);

  const handleGetActiveTests = useCallback(() => {
    try {
      setError(null);
      return abTestManager.getActiveTests();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active tests';
      setError(errorMessage);
      return [];
    }
  }, []);

  const handleGetTest = useCallback((testId: string) => {
    try {
      setError(null);
      return abTestManager.getTest(testId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get test';
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    createTest: handleCreateTest,
    startTest: handleStartTest,
    stopTest: handleStopTest,
    updateTest: handleUpdateTest,
    getVariantForUser: handleGetVariantForUser,
    applyVariantToNotification: handleApplyVariantToNotification,
    shouldSendNotification: handleShouldSendNotification,
    recordTestEvent: handleRecordTestEvent,
    getTestAnalysis: handleGetTestAnalysis,
    getActiveTests: handleGetActiveTests,
    getTest: handleGetTest,
    isLoading,
    error
  };
}

/**
 * Hook for managing a specific A/B test
 */
export function useABTest(testId: string) {
  const [test, setTest] = useState<ABTest | null>(null);
  const [analysis, setAnalysis] = useState<ABTestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abTesting = useABTesting();

  const refreshTest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const testData = abTesting.getTest(testId);
      const analysisData = abTesting.getTestAnalysis(testId);

      setTest(testData);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test data');
    } finally {
      setLoading(false);
    }
  }, [testId, abTesting]);

  useEffect(() => {
    refreshTest();
  }, [refreshTest]);

  const startTest = useCallback(async () => {
    try {
      const success = abTesting.startTest(testId);
      if (success) {
        await refreshTest();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
      return false;
    }
  }, [testId, abTesting, refreshTest]);

  const stopTest = useCallback(async (reason?: string) => {
    try {
      const success = abTesting.stopTest(testId, reason);
      if (success) {
        await refreshTest();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop test');
      return false;
    }
  }, [testId, abTesting, refreshTest]);

  const updateTest = useCallback(async (updates: Partial<ABTest>) => {
    try {
      const success = abTesting.updateTest(testId, updates);
      if (success) {
        await refreshTest();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update test');
      return false;
    }
  }, [testId, abTesting, refreshTest]);

  return {
    test,
    analysis,
    loading,
    error,
    startTest,
    stopTest,
    updateTest,
    refresh: refreshTest
  };
}

/**
 * Hook for applying A/B test variants to notifications
 */
export function useNotificationVariant(userId: number, notification: Notification) {
  const [appliedNotification, setAppliedNotification] = useState<Notification>(notification);
  const [activeVariant, setActiveVariant] = useState<ABTestVariant | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const abTesting = useABTesting();

  useEffect(() => {
    const applyVariants = () => {
      const activeTests = abTesting.getActiveTests();
      let modifiedNotification = { ...notification };
      let appliedVariant: ABTestVariant | null = null;
      let testId: string | null = null;

      // Apply variants from active tests
      for (const test of activeTests) {
        const variant = abTesting.getVariantForUser(userId, test.id);
        if (variant) {
          // Check if notification should be sent based on variant rules
          const shouldSend = abTesting.shouldSendNotification(userId, test.id, modifiedNotification);
          if (!shouldSend) {
            // Don't send this notification
            return;
          }

          modifiedNotification = abTesting.applyVariantToNotification(modifiedNotification, variant);
          appliedVariant = variant;
          testId = test.id;

          // Record that variant was applied
          abTesting.recordTestEvent(userId, test.id, 'variant_applied', {
            variantId: variant.id,
            notificationId: notification.id
          });
        }
      }

      setAppliedNotification(modifiedNotification);
      setActiveVariant(appliedVariant);
      setActiveTestId(testId);
    };

    applyVariants();
  }, [userId, notification, abTesting]);

  const recordEvent = useCallback((eventType: string, metadata?: Record<string, any>) => {
    if (activeTestId) {
      abTesting.recordTestEvent(userId, activeTestId, eventType, {
        ...metadata,
        variantId: activeVariant?.id,
        notificationId: notification.id
      });
    }
  }, [userId, activeTestId, activeVariant, notification.id, abTesting]);

  return {
    notification: appliedNotification,
    variant: activeVariant,
    testId: activeTestId,
    recordEvent
  };
}

/**
 * Hook for A/B test creation wizard
 */
export function useABTestWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [testConfig, setTestConfig] = useState<Partial<ABTest>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createdTest, setCreatedTest] = useState<ABTest | null>(null);

  const abTesting = useABTesting();

  const steps = [
    'Basic Information',
    'Variants Configuration',
    'Target Audience',
    'Success Metrics',
    'Review & Create'
  ];

  const updateConfig = useCallback((updates: Partial<ABTest>) => {
    setTestConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const createTest = useCallback(async () => {
    try {
      setIsCreating(true);
      
      // Validate required fields
      if (!testConfig.name || !testConfig.variants || testConfig.variants.length < 2) {
        throw new Error('Test name and at least 2 variants are required');
      }

      const test = abTesting.createTest(testConfig as Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'status'>);
      setCreatedTest(test);
      
      return test;
    } catch (err) {
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [testConfig, abTesting]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setTestConfig({});
    setCreatedTest(null);
    setIsCreating(false);
  }, []);

  return {
    currentStep,
    steps,
    testConfig,
    isCreating,
    createdTest,
    updateConfig,
    nextStep,
    prevStep,
    createTest,
    reset
  };
}