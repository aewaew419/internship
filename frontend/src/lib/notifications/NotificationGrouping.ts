'use client';

import type { Notification, NotificationType, NotificationCategory } from '../../types/notifications';

interface NotificationGroup {
  id: string;
  title: string;
  description?: string;
  notifications: Notification[];
  priority: 'high' | 'normal' | 'low';
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  groupType: 'time' | 'type' | 'category' | 'priority' | 'smart';
  metadata: Record<string, any>;
}

interface GroupingStrategy {
  name: string;
  description: string;
  group: (notifications: Notification[]) => NotificationGroup[];
  shouldGroup: (notifications: Notification[]) => boolean;
  priority: number;
}

interface GroupingConfig {
  maxGroupSize: number;
  timeWindowMs: number;
  enableSmartGrouping: boolean;
  groupingStrategies: string[];
}

export class NotificationGrouping {
  private config: GroupingConfig;
  private strategies = new Map<string, GroupingStrategy>();

  constructor(config: Partial<GroupingConfig> = {}) {
    this.config = {
      maxGroupSize: config.maxGroupSize || 10,
      timeWindowMs: config.timeWindowMs || 5 * 60 * 1000, // 5 minutes
      enableSmartGrouping: config.enableSmartGrouping ?? true,
      groupingStrategies: config.groupingStrategies || [
        'priority',
        'type',
        'time',
        'category',
        'smart',
      ],
    };

    this.initializeStrategies();
  }

  // Initialize built-in grouping strategies
  private initializeStrategies(): void {
    // Priority-based grouping
    this.strategies.set('priority', {
      name: 'priority',
      description: 'Group by notification priority',
      priority: 10,
      shouldGroup: (notifications) => notifications.length > 3,
      group: (notifications) => this.groupByPriority(notifications),
    });

    // Type-based grouping
    this.strategies.set('type', {
      name: 'type',
      description: 'Group by notification type',
      priority: 8,
      shouldGroup: (notifications) => notifications.length > 2,
      group: (notifications) => this.groupByType(notifications),
    });

    // Time-based grouping
    this.strategies.set('time', {
      name: 'time',
      description: 'Group by time windows',
      priority: 6,
      shouldGroup: (notifications) => notifications.length > 5,
      group: (notifications) => this.groupByTime(notifications),
    });

    // Category-based grouping
    this.strategies.set('category', {
      name: 'category',
      description: 'Group by notification category',
      priority: 7,
      shouldGroup: (notifications) => notifications.length > 3,
      group: (notifications) => this.groupByCategory(notifications),
    });

    // Smart grouping
    this.strategies.set('smart', {
      name: 'smart',
      description: 'Intelligent grouping based on content and patterns',
      priority: 9,
      shouldGroup: (notifications) => notifications.length > 4,
      group: (notifications) => this.smartGroup(notifications),
    });
  }

  // Main grouping function
  groupNotifications(notifications: Notification[]): NotificationGroup[] {
    if (notifications.length === 0) return [];

    // Sort strategies by priority
    const enabledStrategies = Array.from(this.strategies.values())
      .filter(strategy => this.config.groupingStrategies.includes(strategy.name))
      .sort((a, b) => b.priority - a.priority);

    // Try each strategy until one succeeds
    for (const strategy of enabledStrategies) {
      if (strategy.shouldGroup(notifications)) {
        try {
          const groups = strategy.group(notifications);
          if (groups.length > 0 && groups.length < notifications.length) {
            return this.optimizeGroups(groups);
          }
        } catch (error) {
          console.warn(`Grouping strategy ${strategy.name} failed:`, error);
        }
      }
    }

    // Fallback: return individual notifications as single-item groups
    return notifications.map(notification => this.createSingleNotificationGroup(notification));
  }

  // Group by priority
  private groupByPriority(notifications: Notification[]): NotificationGroup[] {
    const groups = new Map<string, Notification[]>();

    notifications.forEach(notification => {
      const key = notification.priority;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries()).map(([priority, notifs]) => ({
      id: `priority-${priority}-${Date.now()}`,
      title: this.getPriorityGroupTitle(priority as any, notifs.length),
      notifications: notifs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      priority: priority as any,
      unreadCount: notifs.filter(n => !n.isRead).length,
      createdAt: new Date(Math.min(...notifs.map(n => new Date(n.createdAt).getTime()))),
      updatedAt: new Date(Math.max(...notifs.map(n => new Date(n.createdAt).getTime()))),
      groupType: 'priority',
      metadata: { priority },
    }));
  }

  // Group by type
  private groupByType(notifications: Notification[]): NotificationGroup[] {
    const groups = new Map<NotificationType, Notification[]>();

    notifications.forEach(notification => {
      const key = notification.type;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries())
      .filter(([, notifs]) => notifs.length > 1) // Only group if multiple notifications
      .map(([type, notifs]) => ({
        id: `type-${type}-${Date.now()}`,
        title: this.getTypeGroupTitle(type, notifs.length),
        notifications: notifs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        priority: this.getGroupPriority(notifs),
        unreadCount: notifs.filter(n => !n.isRead).length,
        createdAt: new Date(Math.min(...notifs.map(n => new Date(n.createdAt).getTime()))),
        updatedAt: new Date(Math.max(...notifs.map(n => new Date(n.createdAt).getTime()))),
        groupType: 'type',
        metadata: { type },
      }));
  }

  // Group by time windows
  private groupByTime(notifications: Notification[]): NotificationGroup[] {
    const groups = new Map<number, Notification[]>();

    notifications.forEach(notification => {
      const timestamp = new Date(notification.createdAt).getTime();
      const window = Math.floor(timestamp / this.config.timeWindowMs);
      
      if (!groups.has(window)) {
        groups.set(window, []);
      }
      groups.get(window)!.push(notification);
    });

    return Array.from(groups.entries())
      .filter(([, notifs]) => notifs.length > 2) // Only group if 3+ notifications
      .map(([window, notifs]) => {
        const windowStart = new Date(window * this.config.timeWindowMs);
        return {
          id: `time-${window}-${Date.now()}`,
          title: this.getTimeGroupTitle(windowStart, notifs.length),
          notifications: notifs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          priority: this.getGroupPriority(notifs),
          unreadCount: notifs.filter(n => !n.isRead).length,
          createdAt: new Date(Math.min(...notifs.map(n => new Date(n.createdAt).getTime()))),
          updatedAt: new Date(Math.max(...notifs.map(n => new Date(n.createdAt).getTime()))),
          groupType: 'time',
          metadata: { window, windowStart },
        };
      });
  }

  // Group by category
  private groupByCategory(notifications: Notification[]): NotificationGroup[] {
    const groups = new Map<NotificationCategory, Notification[]>();

    notifications.forEach(notification => {
      const key = notification.category;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries())
      .filter(([, notifs]) => notifs.length > 1)
      .map(([category, notifs]) => ({
        id: `category-${category}-${Date.now()}`,
        title: this.getCategoryGroupTitle(category, notifs.length),
        notifications: notifs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        priority: this.getGroupPriority(notifs),
        unreadCount: notifs.filter(n => !n.isRead).length,
        createdAt: new Date(Math.min(...notifs.map(n => new Date(n.createdAt).getTime()))),
        updatedAt: new Date(Math.max(...notifs.map(n => new Date(n.createdAt).getTime()))),
        groupType: 'category',
        metadata: { category },
      }));
  }

  // Smart grouping based on content similarity and patterns
  private smartGroup(notifications: Notification[]): NotificationGroup[] {
    const groups: NotificationGroup[] = [];
    const processed = new Set<string>();

    // Group by content similarity
    notifications.forEach(notification => {
      if (processed.has(notification.id)) return;

      const similarNotifications = this.findSimilarNotifications(
        notification,
        notifications.filter(n => !processed.has(n.id))
      );

      if (similarNotifications.length > 1) {
        similarNotifications.forEach(n => processed.add(n.id));
        
        groups.push({
          id: `smart-${notification.type}-${Date.now()}`,
          title: this.getSmartGroupTitle(similarNotifications),
          description: this.getSmartGroupDescription(similarNotifications),
          notifications: similarNotifications.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          priority: this.getGroupPriority(similarNotifications),
          unreadCount: similarNotifications.filter(n => !n.isRead).length,
          createdAt: new Date(Math.min(...similarNotifications.map(n => new Date(n.createdAt).getTime()))),
          updatedAt: new Date(Math.max(...similarNotifications.map(n => new Date(n.createdAt).getTime()))),
          groupType: 'smart',
          metadata: {
            similarity: this.calculateGroupSimilarity(similarNotifications),
            pattern: this.detectPattern(similarNotifications),
          },
        });
      }
    });

    return groups;
  }

  // Find notifications similar to the given one
  private findSimilarNotifications(
    target: Notification,
    candidates: Notification[]
  ): Notification[] {
    const similar = [target];
    const threshold = 0.7; // Similarity threshold

    candidates.forEach(candidate => {
      if (candidate.id === target.id) return;

      const similarity = this.calculateSimilarity(target, candidate);
      if (similarity >= threshold) {
        similar.push(candidate);
      }
    });

    return similar;
  }

  // Calculate similarity between two notifications
  private calculateSimilarity(a: Notification, b: Notification): number {
    let score = 0;
    let factors = 0;

    // Type similarity
    if (a.type === b.type) {
      score += 0.4;
    }
    factors += 0.4;

    // Category similarity
    if (a.category === b.category) {
      score += 0.2;
    }
    factors += 0.2;

    // Priority similarity
    if (a.priority === b.priority) {
      score += 0.1;
    }
    factors += 0.1;

    // Content similarity (simplified)
    const titleSimilarity = this.calculateTextSimilarity(a.title, b.title);
    const bodySimilarity = this.calculateTextSimilarity(a.body, b.body);
    const contentScore = (titleSimilarity * 0.6 + bodySimilarity * 0.4) * 0.3;
    score += contentScore;
    factors += 0.3;

    return factors > 0 ? score / factors : 0;
  }

  // Calculate text similarity (simplified)
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Calculate group similarity score
  private calculateGroupSimilarity(notifications: Notification[]): number {
    if (notifications.length < 2) return 1;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < notifications.length; i++) {
      for (let j = i + 1; j < notifications.length; j++) {
        totalSimilarity += this.calculateSimilarity(notifications[i], notifications[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  // Detect patterns in notification groups
  private detectPattern(notifications: Notification[]): string {
    const types = new Set(notifications.map(n => n.type));
    const categories = new Set(notifications.map(n => n.category));
    const priorities = new Set(notifications.map(n => n.priority));

    if (types.size === 1) {
      return `same-type-${Array.from(types)[0]}`;
    }
    
    if (categories.size === 1) {
      return `same-category-${Array.from(categories)[0]}`;
    }
    
    if (priorities.size === 1) {
      return `same-priority-${Array.from(priorities)[0]}`;
    }

    // Check for time-based patterns
    const timestamps = notifications.map(n => new Date(n.createdAt).getTime());
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    
    if (timeSpan < this.config.timeWindowMs) {
      return 'time-cluster';
    }

    return 'mixed';
  }

  // Optimize groups by merging small groups and splitting large ones
  private optimizeGroups(groups: NotificationGroup[]): NotificationGroup[] {
    const optimized: NotificationGroup[] = [];

    groups.forEach(group => {
      if (group.notifications.length > this.config.maxGroupSize) {
        // Split large groups
        const subGroups = this.splitLargeGroup(group);
        optimized.push(...subGroups);
      } else if (group.notifications.length === 1) {
        // Keep single notifications as is
        optimized.push(group);
      } else {
        // Keep normal-sized groups
        optimized.push(group);
      }
    });

    // Try to merge small groups of the same type
    return this.mergeSmallGroups(optimized);
  }

  // Split large groups into smaller ones
  private splitLargeGroup(group: NotificationGroup): NotificationGroup[] {
    const subGroups: NotificationGroup[] = [];
    const notifications = group.notifications;
    const chunkSize = Math.ceil(this.config.maxGroupSize / 2);

    for (let i = 0; i < notifications.length; i += chunkSize) {
      const chunk = notifications.slice(i, i + chunkSize);
      
      subGroups.push({
        ...group,
        id: `${group.id}-part-${Math.floor(i / chunkSize) + 1}`,
        title: `${group.title} (Part ${Math.floor(i / chunkSize) + 1})`,
        notifications: chunk,
        unreadCount: chunk.filter(n => !n.isRead).length,
        createdAt: new Date(Math.min(...chunk.map(n => new Date(n.createdAt).getTime()))),
        updatedAt: new Date(Math.max(...chunk.map(n => new Date(n.createdAt).getTime()))),
      });
    }

    return subGroups;
  }

  // Merge small groups of similar type
  private mergeSmallGroups(groups: NotificationGroup[]): NotificationGroup[] {
    // This is a simplified implementation
    // In practice, you'd want more sophisticated merging logic
    return groups;
  }

  // Create a group for a single notification
  private createSingleNotificationGroup(notification: Notification): NotificationGroup {
    return {
      id: `single-${notification.id}`,
      title: notification.title,
      notifications: [notification],
      priority: notification.priority,
      unreadCount: notification.isRead ? 0 : 1,
      createdAt: new Date(notification.createdAt),
      updatedAt: new Date(notification.createdAt),
      groupType: 'smart',
      metadata: { single: true },
    };
  }

  // Get group priority based on contained notifications
  private getGroupPriority(notifications: Notification[]): 'high' | 'normal' | 'low' {
    const priorities = notifications.map(n => n.priority);
    
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('normal')) return 'normal';
    return 'low';
  }

  // Generate group titles
  private getPriorityGroupTitle(priority: string, count: number): string {
    const priorityLabels = {
      high: 'High Priority',
      normal: 'Normal Priority',
      low: 'Low Priority',
    };
    
    return `${priorityLabels[priority as keyof typeof priorityLabels] || priority} (${count})`;
  }

  private getTypeGroupTitle(type: NotificationType, count: number): string {
    const typeLabels = {
      [NotificationType.ASSIGNMENT_CHANGE]: 'Assignment Updates',
      [NotificationType.GRADE_UPDATE]: 'Grade Updates',
      [NotificationType.SCHEDULE_REMINDER]: 'Schedule Reminders',
      [NotificationType.DOCUMENT_UPDATE]: 'Document Updates',
      [NotificationType.DEADLINE_REMINDER]: 'Deadline Reminders',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 'System Announcements',
      [NotificationType.EVALUATION_REQUEST]: 'Evaluation Requests',
      [NotificationType.VISIT_SCHEDULED]: 'Visit Schedules',
    };
    
    return `${typeLabels[type] || type} (${count})`;
  }

  private getCategoryGroupTitle(category: NotificationCategory, count: number): string {
    const categoryLabels = {
      [NotificationCategory.ACADEMIC]: 'Academic',
      [NotificationCategory.ADMINISTRATIVE]: 'Administrative',
      [NotificationCategory.SYSTEM]: 'System',
      [NotificationCategory.REMINDER]: 'Reminders',
    };
    
    return `${categoryLabels[category] || category} (${count})`;
  }

  private getTimeGroupTitle(windowStart: Date, count: number): string {
    const now = new Date();
    const diffMs = now.getTime() - windowStart.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    let timeLabel = '';
    if (diffHours < 1) {
      timeLabel = 'Recent';
    } else if (diffHours < 24) {
      timeLabel = `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      timeLabel = `${diffDays}d ago`;
    }
    
    return `${timeLabel} (${count})`;
  }

  private getSmartGroupTitle(notifications: Notification[]): string {
    const types = new Set(notifications.map(n => n.type));
    const categories = new Set(notifications.map(n => n.category));
    
    if (types.size === 1) {
      return this.getTypeGroupTitle(Array.from(types)[0], notifications.length);
    }
    
    if (categories.size === 1) {
      return this.getCategoryGroupTitle(Array.from(categories)[0], notifications.length);
    }
    
    return `Related Notifications (${notifications.length})`;
  }

  private getSmartGroupDescription(notifications: Notification[]): string {
    const pattern = this.detectPattern(notifications);
    const similarity = this.calculateGroupSimilarity(notifications);
    
    if (similarity > 0.8) {
      return 'Highly similar notifications grouped together';
    } else if (pattern.startsWith('same-type')) {
      return 'Notifications of the same type';
    } else if (pattern.startsWith('same-category')) {
      return 'Notifications from the same category';
    } else if (pattern === 'time-cluster') {
      return 'Notifications received around the same time';
    }
    
    return 'Related notifications';
  }

  // Add custom grouping strategy
  addStrategy(strategy: GroupingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  // Remove grouping strategy
  removeStrategy(name: string): void {
    this.strategies.delete(name);
  }

  // Get available strategies
  getStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  // Update configuration
  updateConfig(config: Partial<GroupingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Global grouping instance
export const notificationGrouping = new NotificationGrouping({
  maxGroupSize: 8,
  timeWindowMs: 10 * 60 * 1000, // 10 minutes
  enableSmartGrouping: true,
  groupingStrategies: ['smart', 'priority', 'type', 'time'],
});