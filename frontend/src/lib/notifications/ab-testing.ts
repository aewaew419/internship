/**
 * A/B Testing Framework for Notification Optimization
 * 
 * Provides functionality to create, manage, and analyze A/B tests for notification
 * improvements including timing, content, frequency, and targeting optimizations.
 */

import { NotificationType, NotificationCategory, Notification } from '../../types/notifications';
import { notificationEngagementTracker } from './engagement-tracking';

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: ABTestConfig;
  trafficPercentage: number;
  isControl: boolean;
}

export interface ABTestConfig {
  timing?: {
    preferredHours?: number[];
    preferredDays?: number[];
    delayMinutes?: number;
  };
  content?: {
    titleTemplate?: string;
    bodyTemplate?: string;
    useEmoji?: boolean;
    maxLength?: number;
  };
  frequency?: {
    maxPerDay?: number;
    maxPerWeek?: number;
    cooldownMinutes?: number;
  };
  targeting?: {
    userSegments?: string[];
    notificationTypes?: NotificationType[];
    categories?: NotificationCategory[];
  };
  presentation?: {
    priority?: 'high' | 'normal' | 'low';
    requireInteraction?: boolean;
    showActions?: boolean;
    customIcon?: string;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABTestVariant[];
  targetAudience: {
    userIds?: number[];
    criteria?: Record<string, any>;
    sampleSize?: number;
  };
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  startDate: number;
  endDate?: number;
  duration: number; // in days
  primaryMetric: 'openRate' | 'clickRate' | 'engagementScore' | 'actionRate';
  secondaryMetrics: string[];
  minimumSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ABTestResult {
  testId: string;
  variant: ABTestVariant;
  metrics: {
    sampleSize: number;
    openRate: number;
    clickRate: number;
    actionRate: number;
    engagementScore: number;
    conversionRate: number;
    averageTimeToAction: number;
  };
  confidence: number;
  isStatisticallySignificant: boolean;
  pValue: number;
  effect: number; // percentage improvement over control
}

export interface ABTestAnalysis {
  test: ABTest;
  results: ABTestResult[];
  winner?: ABTestResult;
  recommendation: {
    action: 'continue' | 'stop' | 'extend' | 'implement_winner';
    reason: string;
    confidence: number;
  };
  insights: string[];
  nextSteps: string[];
}

/**
 * A/B Testing Manager
 * Manages creation, execution, and analysis of notification A/B tests
 */
export class ABTestManager {
  private static instance: ABTestManager;
  private activeTests: Map<string, ABTest> = new Map();
  private testAssignments: Map<number, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private testResults: Map<string, ABTestResult[]> = new Map();

  private constructor() {
    this.loadStoredTests();
  }

  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  /**
   * Create a new A/B test
   */
  createTest(testConfig: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ABTest {
    const test: ABTest = {
      ...testConfig,
      id: this.generateTestId(),
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Validate test configuration
    this.validateTest(test);

    this.activeTests.set(test.id, test);
    this.storeTests();

    console.log(`Created A/B test: ${test.name} (${test.id})`);
    return test;
  }

  /**
   * Start an A/B test
   */
  startTest(testId: string): boolean {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'draft') {
      throw new Error(`Test ${testId} cannot be started (current status: ${test.status})`);
    }

    test.status = 'running';
    test.startDate = Date.now();
    test.endDate = test.startDate + (test.duration * 24 * 60 * 60 * 1000);
    test.updatedAt = Date.now();

    this.activeTests.set(testId, test);
    this.storeTests();

    console.log(`Started A/B test: ${test.name} (${testId})`);
    return true;
  }

  /**
   * Stop an A/B test
   */
  stopTest(testId: string, reason: string = 'Manual stop'): boolean {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'completed';
    test.endDate = Date.now();
    test.updatedAt = Date.now();

    this.activeTests.set(testId, test);
    this.storeTests();

    console.log(`Stopped A/B test: ${test.name} (${testId}) - ${reason}`);
    return true;
  }

  /**
   * Get variant assignment for a user and test
   */
  getVariantForUser(userId: number, testId: string): ABTestVariant | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Check if user is in target audience
    if (!this.isUserInTargetAudience(userId, test)) {
      return null;
    }

    // Get or create assignment
    let userAssignments = this.testAssignments.get(userId);
    if (!userAssignments) {
      userAssignments = new Map();
      this.testAssignments.set(userId, userAssignments);
    }

    let variantId = userAssignments.get(testId);
    if (!variantId) {
      // Assign user to variant based on traffic allocation
      variantId = this.assignUserToVariant(userId, test);
      userAssignments.set(testId, variantId);
      this.storeAssignments();
    }

    return test.variants.find(v => v.id === variantId) || null;
  }

  /**
   * Apply variant configuration to a notification
   */
  applyVariantToNotification(notification: Notification, variant: ABTestVariant): Notification {
    const modifiedNotification = { ...notification };
    const config = variant.config;

    // Apply content modifications
    if (config.content) {
      if (config.content.titleTemplate) {
        modifiedNotification.title = this.applyTemplate(config.content.titleTemplate, notification);
      }
      if (config.content.bodyTemplate) {
        modifiedNotification.body = this.applyTemplate(config.content.bodyTemplate, notification);
      }
      if (config.content.maxLength) {
        if (modifiedNotification.body.length > config.content.maxLength) {
          modifiedNotification.body = modifiedNotification.body.substring(0, config.content.maxLength - 3) + '...';
        }
      }
    }

    // Apply presentation modifications
    if (config.presentation) {
      if (config.presentation.priority) {
        modifiedNotification.priority = config.presentation.priority;
      }
      if (config.presentation.showActions === false) {
        modifiedNotification.actions = [];
      }
    }

    return modifiedNotification;
  }

  /**
   * Check if notification should be sent based on variant timing rules
   */
  shouldSendNotification(userId: number, testId: string, notification: Notification): boolean {
    const variant = this.getVariantForUser(userId, testId);
    if (!variant) return true;

    const config = variant.config;
    const now = new Date();

    // Check timing constraints
    if (config.timing) {
      if (config.timing.preferredHours) {
        const currentHour = now.getHours();
        if (!config.timing.preferredHours.includes(currentHour)) {
          return false;
        }
      }

      if (config.timing.preferredDays) {
        const currentDay = now.getDay();
        if (!config.timing.preferredDays.includes(currentDay)) {
          return false;
        }
      }
    }

    // Check frequency constraints
    if (config.frequency) {
      const userNotificationHistory = this.getUserNotificationHistory(userId);
      
      if (config.frequency.maxPerDay) {
        const todayCount = this.getNotificationCountForPeriod(userNotificationHistory, 'day');
        if (todayCount >= config.frequency.maxPerDay) {
          return false;
        }
      }

      if (config.frequency.maxPerWeek) {
        const weekCount = this.getNotificationCountForPeriod(userNotificationHistory, 'week');
        if (weekCount >= config.frequency.maxPerWeek) {
          return false;
        }
      }

      if (config.frequency.cooldownMinutes) {
        const lastNotification = userNotificationHistory[0];
        if (lastNotification) {
          const timeSinceLastNotification = Date.now() - new Date(lastNotification.createdAt).getTime();
          if (timeSinceLastNotification < config.frequency.cooldownMinutes * 60 * 1000) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Record test event for analysis
   */
  recordTestEvent(userId: number, testId: string, eventType: string, metadata?: Record<string, any>): void {
    const variant = this.getVariantForUser(userId, testId);
    if (!variant) return;

    // This would typically be sent to an analytics service
    console.log(`A/B Test Event: ${testId} - ${variant.id} - ${eventType}`, metadata);
  }

  /**
   * Get test results and analysis
   */
  getTestAnalysis(testId: string): ABTestAnalysis | null {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    const results = this.calculateTestResults(test);
    const winner = this.determineWinner(results);
    const recommendation = this.generateRecommendation(test, results, winner);
    const insights = this.generateInsights(test, results);
    const nextSteps = this.generateNextSteps(test, results, winner);

    return {
      test,
      results,
      winner,
      recommendation,
      insights,
      nextSteps
    };
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'running');
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): ABTest | null {
    return this.activeTests.get(testId) || null;
  }

  /**
   * Update test configuration
   */
  updateTest(testId: string, updates: Partial<ABTest>): boolean {
    const test = this.activeTests.get(testId);
    if (!test) return false;

    if (test.status === 'running') {
      // Only allow certain updates while test is running
      const allowedUpdates = ['description', 'endDate'];
      const updateKeys = Object.keys(updates);
      const hasDisallowedUpdates = updateKeys.some(key => !allowedUpdates.includes(key));
      
      if (hasDisallowedUpdates) {
        throw new Error('Cannot modify test configuration while test is running');
      }
    }

    Object.assign(test, updates, { updatedAt: Date.now() });
    this.activeTests.set(testId, test);
    this.storeTests();

    return true;
  }

  // Private methods

  private validateTest(test: ABTest): void {
    // Validate variants
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    const totalTraffic = test.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Variant traffic percentages must sum to 100%');
    }

    const controlVariants = test.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Test must have exactly one control variant');
    }

    // Validate duration
    if (test.duration < 1) {
      throw new Error('Test duration must be at least 1 day');
    }

    // Validate confidence level
    if (![0.90, 0.95, 0.99].includes(test.confidenceLevel)) {
      throw new Error('Confidence level must be 0.90, 0.95, or 0.99');
    }
  }

  private isUserInTargetAudience(userId: number, test: ABTest): boolean {
    const { targetAudience } = test;

    // Check specific user IDs
    if (targetAudience.userIds && targetAudience.userIds.length > 0) {
      return targetAudience.userIds.includes(userId);
    }

    // Check sample size limit
    if (targetAudience.sampleSize) {
      const currentParticipants = this.getTestParticipantCount(test.id);
      if (currentParticipants >= targetAudience.sampleSize) {
        return false;
      }
    }

    // Additional criteria would be checked here
    // For now, include all users not explicitly excluded
    return true;
  }

  private assignUserToVariant(userId: number, test: ABTest): string {
    // Use deterministic assignment based on user ID and test ID
    const hash = this.hashString(`${userId}-${test.id}`);
    const bucket = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (bucket < cumulativePercentage) {
        return variant.id;
      }
    }

    // Fallback to control variant
    return test.variants.find(v => v.isControl)?.id || test.variants[0].id;
  }

  private applyTemplate(template: string, notification: Notification): string {
    return template
      .replace(/\{title\}/g, notification.title)
      .replace(/\{body\}/g, notification.body)
      .replace(/\{type\}/g, notification.type)
      .replace(/\{category\}/g, notification.category);
  }

  private getUserNotificationHistory(userId: number): Notification[] {
    // This would typically fetch from a database or cache
    // For now, return empty array
    return [];
  }

  private getNotificationCountForPeriod(history: Notification[], period: 'day' | 'week'): number {
    const now = Date.now();
    const periodMs = period === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const cutoff = now - periodMs;

    return history.filter(n => new Date(n.createdAt).getTime() > cutoff).length;
  }

  private calculateTestResults(test: ABTest): ABTestResult[] {
    // This would calculate actual results from engagement data
    // For now, return mock results
    return test.variants.map(variant => ({
      testId: test.id,
      variant,
      metrics: {
        sampleSize: Math.floor(Math.random() * 1000) + 500,
        openRate: Math.random() * 0.8 + 0.1,
        clickRate: Math.random() * 0.4 + 0.05,
        actionRate: Math.random() * 0.2 + 0.02,
        engagementScore: Math.floor(Math.random() * 40) + 60,
        conversionRate: Math.random() * 0.1 + 0.01,
        averageTimeToAction: Math.random() * 300000 + 30000
      },
      confidence: Math.random() * 0.3 + 0.7,
      isStatisticallySignificant: Math.random() > 0.3,
      pValue: Math.random() * 0.1,
      effect: (Math.random() - 0.5) * 0.4
    }));
  }

  private determineWinner(results: ABTestResult[]): ABTestResult | undefined {
    const significantResults = results.filter(r => r.isStatisticallySignificant);
    if (significantResults.length === 0) return undefined;

    return significantResults.reduce((winner, current) => 
      current.metrics.engagementScore > winner.metrics.engagementScore ? current : winner
    );
  }

  private generateRecommendation(test: ABTest, results: ABTestResult[], winner?: ABTestResult): ABTestAnalysis['recommendation'] {
    if (!winner) {
      return {
        action: 'continue',
        reason: 'No statistically significant winner yet. Continue test to gather more data.',
        confidence: 0.5
      };
    }

    if (winner.confidence > 0.95 && winner.effect > 0.1) {
      return {
        action: 'implement_winner',
        reason: `Variant "${winner.variant.name}" shows significant improvement with high confidence.`,
        confidence: winner.confidence
      };
    }

    return {
      action: 'extend',
      reason: 'Results are promising but need more data for conclusive decision.',
      confidence: winner.confidence
    };
  }

  private generateInsights(test: ABTest, results: ABTestResult[]): string[] {
    const insights: string[] = [];

    // Compare variants
    const control = results.find(r => r.variant.isControl);
    const treatments = results.filter(r => !r.variant.isControl);

    if (control) {
      treatments.forEach(treatment => {
        const improvement = ((treatment.metrics.engagementScore - control.metrics.engagementScore) / control.metrics.engagementScore) * 100;
        if (Math.abs(improvement) > 5) {
          insights.push(`${treatment.variant.name} shows ${improvement > 0 ? 'positive' : 'negative'} impact of ${Math.abs(improvement).toFixed(1)}% on engagement`);
        }
      });
    }

    // Sample size insights
    const totalSampleSize = results.reduce((sum, r) => sum + r.metrics.sampleSize, 0);
    if (totalSampleSize < test.minimumSampleSize) {
      insights.push(`Sample size (${totalSampleSize}) is below minimum required (${test.minimumSampleSize})`);
    }

    return insights;
  }

  private generateNextSteps(test: ABTest, results: ABTestResult[], winner?: ABTestResult): string[] {
    const steps: string[] = [];

    if (winner && winner.confidence > 0.95) {
      steps.push('Implement winning variant across all users');
      steps.push('Monitor performance after full rollout');
      steps.push('Document learnings for future tests');
    } else {
      steps.push('Continue test to reach statistical significance');
      steps.push('Monitor for any unusual patterns or external factors');
      if (results.some(r => r.metrics.sampleSize < 100)) {
        steps.push('Increase traffic allocation to gather more data faster');
      }
    }

    return steps;
  }

  private getTestParticipantCount(testId: string): number {
    let count = 0;
    this.testAssignments.forEach(userAssignments => {
      if (userAssignments.has(testId)) {
        count++;
      }
    });
    return count;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeTests(): void {
    try {
      const testsData = Array.from(this.activeTests.entries());
      localStorage.setItem('ab_tests', JSON.stringify(testsData));
    } catch (error) {
      console.error('Failed to store A/B tests:', error);
    }
  }

  private storeAssignments(): void {
    try {
      const assignmentsData = Array.from(this.testAssignments.entries()).map(([userId, assignments]) => [
        userId,
        Array.from(assignments.entries())
      ]);
      localStorage.setItem('ab_test_assignments', JSON.stringify(assignmentsData));
    } catch (error) {
      console.error('Failed to store A/B test assignments:', error);
    }
  }

  private loadStoredTests(): void {
    try {
      const stored = localStorage.getItem('ab_tests');
      if (stored) {
        const testsData = JSON.parse(stored);
        this.activeTests = new Map(testsData);
      }

      const storedAssignments = localStorage.getItem('ab_test_assignments');
      if (storedAssignments) {
        const assignmentsData = JSON.parse(storedAssignments);
        this.testAssignments = new Map(
          assignmentsData.map(([userId, assignments]: [number, [string, string][]]) => [
            userId,
            new Map(assignments)
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load stored A/B tests:', error);
    }
  }
}

// Export singleton instance
export const abTestManager = ABTestManager.getInstance();

// Convenience functions
export const createABTest = (config: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ABTest => {
  return abTestManager.createTest(config);
};

export const startABTest = (testId: string): boolean => {
  return abTestManager.startTest(testId);
};

export const getVariantForUser = (userId: number, testId: string): ABTestVariant | null => {
  return abTestManager.getVariantForUser(userId, testId);
};

export const applyVariantToNotification = (notification: Notification, variant: ABTestVariant): Notification => {
  return abTestManager.applyVariantToNotification(notification, variant);
};

export const getTestAnalysis = (testId: string): ABTestAnalysis | null => {
  return abTestManager.getTestAnalysis(testId);
};