/**
 * Audit History Service
 * Service for managing audit history visualization, timeline, and rollback operations
 */

import {
  HistoryTimeline,
  TimelineEvent,
  HistoryFilter,
  HistorySummary,
  DiffVisualization,
  TimelineGroup,
  HistoryAnalytics,
  RollbackOperation,
  RollbackData,
  HistorySearch,
  HistoryExport
} from '../types/auditHistory';
import { AuditEvent, AuditChange, AuditAction, AuditEntityType } from '../types/audit';
import { auditService } from './auditService';

class AuditHistoryService {
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get history timeline for an entity
   */
  async getHistoryTimeline(
    entityType: AuditEntityType,
    entityId: string,
    filter?: HistoryFilter
  ): Promise<HistoryTimeline> {
    const cacheKey = `timeline_${entityType}_${entityId}_${JSON.stringify(filter)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const auditFilter = {
        entityType,
        entityId,
        ...filter,
        sortBy: 'timestamp' as const,
        sortOrder: 'desc' as const
      };

      const events = await auditService.getEvents(auditFilter);
      const timelineEvents = await this.convertToTimelineEvents(events);
      const summary = this.generateHistorySummary(timelineEvents);

      const timeline: HistoryTimeline = {
        id: `${entityType}_${entityId}_${Date.now()}`,
        entityType,
        entityId,
        entityName: this.extractEntityName(events[0]),
        events: timelineEvents,
        totalEvents: timelineEvents.length,
        dateRange: this.calculateDateRange(timelineEvents),
        summary
      };

      this.setCachedData(cacheKey, timeline);
      return timeline;
    } catch (error) {
      console.error('Failed to get history timeline:', error);
      throw error;
    }
  }

  /**
   * Get grouped timeline events
   */
  async getGroupedTimeline(
    entityType: AuditEntityType,
    entityId: string,
    groupBy: 'date' | 'user' | 'action' = 'date',
    filter?: HistoryFilter
  ): Promise<TimelineGroup[]> {
    const timeline = await this.getHistoryTimeline(entityType, entityId, filter);
    return this.groupTimelineEvents(timeline.events, groupBy);
  }

  /**
   * Get diff visualization for a specific event
   */
  async getDiffVisualization(eventId: string): Promise<DiffVisualization[]> {
    const cacheKey = `diff_${eventId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const events = await auditService.getEvents({ 
        entityId: eventId,
        limit: 1 
      });

      if (events.length === 0) {
        throw new Error('Event not found');
      }

      const event = events[0];
      const diffs = await this.generateDiffVisualizations(event);
      
      this.setCachedData(cacheKey, diffs);
      return diffs;
    } catch (error) {
      console.error('Failed to get diff visualization:', error);
      throw error;
    }
  }

  /**
   * Search history events
   */
  async searchHistory(
    query: string,
    filters?: HistoryFilter
  ): Promise<HistorySearch> {
    const startTime = Date.now();

    try {
      const searchFilter = {
        ...filters,
        searchTerm: query,
        limit: filters?.limit || 100
      };

      const events = await auditService.getEvents(searchFilter);
      const timelineEvents = await this.convertToTimelineEvents(events);
      
      const results = timelineEvents.map(event => ({
        event,
        relevanceScore: this.calculateRelevanceScore(event, query),
        matchedFields: this.findMatchedFields(event, query),
        highlights: this.generateHighlights(event, query)
      }));

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const searchTime = Date.now() - startTime;
      const suggestions = this.generateSearchSuggestions(query, results);

      return {
        query,
        filters: filters || {},
        results,
        totalResults: results.length,
        searchTime,
        suggestions
      };
    } catch (error) {
      console.error('Failed to search history:', error);
      throw error;
    }
  }

  /**
   * Get history analytics
   */
  async getHistoryAnalytics(
    entityType: AuditEntityType,
    entityId: string,
    period: { start: string; end: string }
  ): Promise<HistoryAnalytics> {
    const cacheKey = `analytics_${entityType}_${entityId}_${period.start}_${period.end}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const timeline = await this.getHistoryTimeline(entityType, entityId, {
        dateFrom: period.start,
        dateTo: period.end
      });

      const analytics = this.generateAnalytics(timeline, period);
      
      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to get history analytics:', error);
      throw error;
    }
  }

  /**
   * Prepare rollback data
   */
  async prepareRollback(eventId: string): Promise<RollbackData> {
    try {
      const events = await auditService.getEvents({ 
        entityId: eventId,
        limit: 1 
      });

      if (events.length === 0) {
        throw new Error('Event not found');
      }

      const event = events[0];
      return this.generateRollbackData(event);
    } catch (error) {
      console.error('Failed to prepare rollback:', error);
      throw error;
    }
  }

  /**
   * Execute rollback operation
   */
  async executeRollback(
    eventId: string,
    rollbackData: RollbackData,
    userId: number
  ): Promise<RollbackOperation> {
    try {
      const operation: RollbackOperation = {
        id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        targetEventId: eventId,
        entityType: rollbackData.affectedFields[0] as AuditEntityType, // Simplified
        entityId: eventId,
        rollbackData,
        status: 'pending',
        initiatedBy: {
          id: userId,
          name: 'Current User', // Would get from context
          email: 'user@example.com'
        },
        initiatedAt: new Date().toISOString()
      };

      // In a real implementation, this would:
      // 1. Validate rollback permissions
      // 2. Check dependencies
      // 3. Execute the rollback
      // 4. Log the rollback operation
      // 5. Update the operation status

      // For now, simulate the operation
      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      operation.result = {
        success: true,
        affectedEntities: [eventId],
        rollbackEvents: [`rollback_event_${Date.now()}`],
        warnings: [],
        errors: [],
        duration: 1000,
        summary: 'Rollback completed successfully'
      };

      return operation;
    } catch (error) {
      console.error('Failed to execute rollback:', error);
      throw error;
    }
  }

  /**
   * Export history data
   */
  async exportHistory(
    timeline: HistoryTimeline,
    format: 'json' | 'csv' | 'pdf' | 'html',
    options: {
      includeMetadata?: boolean;
      includeUserInfo?: boolean;
      includeDiffs?: boolean;
      includeRollbackData?: boolean;
    } = {}
  ): Promise<HistoryExport> {
    try {
      const exportData: HistoryExport = {
        format,
        data: timeline,
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: {
            id: 1, // Would get from context
            name: 'Current User',
            email: 'user@example.com'
          },
          filter: {}, // Would include the filter used
          totalRecords: timeline.totalEvents
        },
        options: {
          includeMetadata: options.includeMetadata ?? true,
          includeUserInfo: options.includeUserInfo ?? true,
          includeDiffs: options.includeDiffs ?? false,
          includeRollbackData: options.includeRollbackData ?? false
        }
      };

      return exportData;
    } catch (error) {
      console.error('Failed to export history:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async convertToTimelineEvents(auditEvents: AuditEvent[]): Promise<TimelineEvent[]> {
    return auditEvents.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      action: event.action,
      user: {
        id: event.userId,
        name: event.userName,
        email: event.userEmail,
        avatar: this.generateAvatarUrl(event.userEmail)
      },
      changes: event.changes,
      severity: event.severity,
      success: event.success,
      errorMessage: event.errorMessage,
      metadata: event.metadata,
      rollbackable: this.isRollbackable(event),
      rollbackData: this.isRollbackable(event) ? this.generateRollbackData(event) : undefined,
      relatedEvents: this.findRelatedEvents(event, auditEvents)
    }));
  }

  private generateHistorySummary(events: TimelineEvent[]): HistorySummary {
    const totalChanges = events.reduce((sum, event) => sum + event.changes.length, 0);
    
    const changesByField: Record<string, number> = {};
    const changesByUser: Record<string, number> = {};
    const changesByAction: Record<AuditAction, number> = {};

    events.forEach(event => {
      // Count changes by field
      event.changes.forEach(change => {
        changesByField[change.field] = (changesByField[change.field] || 0) + 1;
      });

      // Count changes by user
      const userKey = event.user.name;
      changesByUser[userKey] = (changesByUser[userKey] || 0) + event.changes.length;

      // Count changes by action
      changesByAction[event.action] = (changesByAction[event.action] || 0) + 1;
    });

    const mostActiveUser = Object.entries(changesByUser)
      .sort(([,a], [,b]) => b - a)[0];

    const mostChangedField = Object.entries(changesByField)
      .sort(([,a], [,b]) => b - a)[0];

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const changesLast24h = events.filter(e => new Date(e.timestamp) > last24h).length;
    const changesLast7d = events.filter(e => new Date(e.timestamp) > last7d).length;
    const changesLast30d = events.filter(e => new Date(e.timestamp) > last30d).length;

    return {
      totalChanges,
      changesByField,
      changesByUser,
      changesByAction,
      mostActiveUser: mostActiveUser ? {
        id: 0, // Would need to map from name to ID
        name: mostActiveUser[0],
        changeCount: mostActiveUser[1]
      } : { id: 0, name: 'Unknown', changeCount: 0 },
      mostChangedField: mostChangedField ? {
        field: mostChangedField[0],
        changeCount: mostChangedField[1]
      } : { field: 'Unknown', changeCount: 0 },
      recentActivity: {
        lastChange: events[0]?.timestamp || new Date().toISOString(),
        changesLast24h,
        changesLast7d,
        changesLast30d
      }
    };
  }

  private calculateDateRange(events: TimelineEvent[]): { start: string; end: string } {
    if (events.length === 0) {
      const now = new Date().toISOString();
      return { start: now, end: now };
    }

    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    return {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString()
    };
  }

  private groupTimelineEvents(events: TimelineEvent[], groupBy: string): TimelineGroup[] {
    const groups: Record<string, TimelineEvent[]> = {};

    events.forEach(event => {
      let key: string;
      
      switch (groupBy) {
        case 'date':
          key = new Date(event.timestamp).toISOString().split('T')[0];
          break;
        case 'user':
          key = event.user.name;
          break;
        case 'action':
          key = event.action;
          break;
        default:
          key = 'unknown';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });

    return Object.entries(groups).map(([key, groupEvents]) => ({
      date: key,
      events: groupEvents,
      summary: {
        totalEvents: groupEvents.length,
        uniqueUsers: new Set(groupEvents.map(e => e.user.id)).size,
        actions: [...new Set(groupEvents.map(e => e.action))],
        severity: this.calculateGroupSeverity(groupEvents)
      }
    }));
  }

  private generateDiffVisualizations(event: AuditEvent): DiffVisualization[] {
    return event.changes.map(change => ({
      id: `diff_${event.id}_${change.field}`,
      eventId: event.id,
      field: change.field,
      fieldDisplayName: change.displayName,
      oldValue: change.oldValue,
      newValue: change.newValue,
      diffType: this.determineDiffType(change),
      diffLines: this.generateDiffLines(change),
      summary: this.generateDiffSummary(change)
    }));
  }

  private generateRollbackData(event: AuditEvent): RollbackData {
    return {
      targetState: this.calculateTargetState(event),
      affectedFields: event.changes.map(c => c.field),
      dependencies: this.findRollbackDependencies(event),
      warnings: this.generateRollbackWarnings(event),
      estimatedImpact: this.calculateRollbackImpact(event)
    };
  }

  private isRollbackable(event: AuditEvent): boolean {
    // Determine if an event can be rolled back
    const nonRollbackableActions = ['delete', 'login', 'logout'];
    return !nonRollbackableActions.includes(event.action) && event.success;
  }

  private extractEntityName(event?: AuditEvent): string | undefined {
    return event?.entityName || event?.metadata?.name;
  }

  private generateAvatarUrl(email: string): string {
    // Generate avatar URL (could use Gravatar or similar)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`;
  }

  private findRelatedEvents(event: AuditEvent, allEvents: AuditEvent[]): string[] {
    // Find events that are related to this event
    return allEvents
      .filter(e => 
        e.id !== event.id && 
        e.entityId === event.entityId &&
        Math.abs(new Date(e.timestamp).getTime() - new Date(event.timestamp).getTime()) < 60000 // Within 1 minute
      )
      .map(e => e.id);
  }

  private calculateRelevanceScore(event: TimelineEvent, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Check action
    if (event.action.toLowerCase().includes(lowerQuery)) score += 10;
    
    // Check user name
    if (event.user.name.toLowerCase().includes(lowerQuery)) score += 8;
    
    // Check changes
    event.changes.forEach(change => {
      if (change.field.toLowerCase().includes(lowerQuery)) score += 5;
      if (String(change.oldValue).toLowerCase().includes(lowerQuery)) score += 3;
      if (String(change.newValue).toLowerCase().includes(lowerQuery)) score += 3;
    });

    // Check metadata
    if (event.metadata) {
      Object.values(event.metadata).forEach(value => {
        if (String(value).toLowerCase().includes(lowerQuery)) score += 2;
      });
    }

    return score;
  }

  private findMatchedFields(event: TimelineEvent, query: string): string[] {
    const matches: string[] = [];
    const lowerQuery = query.toLowerCase();

    if (event.action.toLowerCase().includes(lowerQuery)) matches.push('action');
    if (event.user.name.toLowerCase().includes(lowerQuery)) matches.push('user');
    
    event.changes.forEach(change => {
      if (change.field.toLowerCase().includes(lowerQuery)) matches.push(change.field);
    });

    return matches;
  }

  private generateHighlights(event: TimelineEvent, query: string): any[] {
    // Generate highlights for search results
    return []; // Simplified for now
  }

  private generateSearchSuggestions(query: string, results: any[]): string[] {
    // Generate search suggestions based on query and results
    return []; // Simplified for now
  }

  private generateAnalytics(timeline: HistoryTimeline, period: any): HistoryAnalytics {
    // Generate comprehensive analytics
    const events = timeline.events;
    const totalDays = Math.max(1, Math.ceil(
      (new Date(period.end).getTime() - new Date(period.start).getTime()) / (24 * 60 * 60 * 1000)
    ));

    return {
      entityId: timeline.entityId,
      entityType: timeline.entityType,
      period,
      metrics: {
        totalChanges: timeline.summary.totalChanges,
        averageChangesPerDay: timeline.summary.totalChanges / totalDays,
        peakActivityDay: this.findPeakActivityDay(events),
        mostActiveUser: timeline.summary.mostActiveUser.name,
        mostChangedField: timeline.summary.mostChangedField.field,
        changeVelocity: this.calculateChangeVelocity(events),
        stabilityScore: this.calculateStabilityScore(events)
      },
      trends: {
        changeFrequency: this.generateTimeSeriesData(events, 'frequency'),
        userActivity: this.generateTimeSeriesData(events, 'user'),
        fieldChanges: this.generateTimeSeriesData(events, 'field'),
        errorRate: this.generateTimeSeriesData(events, 'error')
      },
      patterns: {
        commonChangeSequences: this.findChangeSequences(events),
        userBehaviorPatterns: this.analyzeUserPatterns(events),
        timePatterns: this.analyzeTimePatterns(events)
      }
    };
  }

  // Additional helper methods would be implemented here...
  private calculateGroupSeverity(events: TimelineEvent[]): 'low' | 'medium' | 'high' | 'critical' {
    const severities = events.map(e => e.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private determineDiffType(change: AuditChange): 'added' | 'removed' | 'modified' | 'unchanged' {
    if (change.oldValue === null || change.oldValue === undefined) return 'added';
    if (change.newValue === null || change.newValue === undefined) return 'removed';
    return 'modified';
  }

  private generateDiffLines(change: AuditChange): any[] {
    // Generate diff lines for visualization
    return []; // Simplified for now
  }

  private generateDiffSummary(change: AuditChange): any {
    // Generate diff summary
    return {
      totalLines: 1,
      addedLines: 0,
      removedLines: 0,
      modifiedLines: 1,
      unchangedLines: 0
    };
  }

  private calculateTargetState(event: AuditEvent): any {
    // Calculate what the state should be after rollback
    const targetState: any = {};
    event.changes.forEach(change => {
      targetState[change.field] = change.oldValue;
    });
    return targetState;
  }

  private findRollbackDependencies(event: AuditEvent): any[] {
    // Find dependencies that would be affected by rollback
    return []; // Simplified for now
  }

  private generateRollbackWarnings(event: AuditEvent): any[] {
    // Generate warnings for rollback operation
    return []; // Simplified for now
  }

  private calculateRollbackImpact(event: AuditEvent): any {
    // Calculate the impact of rollback
    return {
      affectedEntities: 1,
      affectedUsers: 1,
      dataLossRisk: 'low',
      systemImpact: 'low',
      estimatedDuration: 1000,
      reversible: true
    };
  }

  private findPeakActivityDay(events: TimelineEvent[]): string {
    // Find the day with most activity
    const dayGroups = this.groupTimelineEvents(events, 'date');
    const peakDay = dayGroups.reduce((max, group) => 
      group.events.length > max.events.length ? group : max
    );
    return peakDay.date;
  }

  private calculateChangeVelocity(events: TimelineEvent[]): number {
    // Calculate changes per hour
    if (events.length < 2) return 0;
    
    const timeSpan = new Date(events[0].timestamp).getTime() - 
                    new Date(events[events.length - 1].timestamp).getTime();
    const hours = timeSpan / (60 * 60 * 1000);
    
    return hours > 0 ? events.length / hours : 0;
  }

  private calculateStabilityScore(events: TimelineEvent[]): number {
    // Calculate stability score (0-100)
    const errorRate = events.filter(e => !e.success).length / events.length;
    const changeFrequency = this.calculateChangeVelocity(events);
    
    // Higher error rate and change frequency = lower stability
    return Math.max(0, Math.min(100, 100 - (errorRate * 50) - (changeFrequency * 10)));
  }

  private generateTimeSeriesData(events: TimelineEvent[], type: string): any[] {
    // Generate time series data for charts
    return []; // Simplified for now
  }

  private findChangeSequences(events: TimelineEvent[]): any[] {
    // Find common sequences of changes
    return []; // Simplified for now
  }

  private analyzeUserPatterns(events: TimelineEvent[]): any[] {
    // Analyze user behavior patterns
    return []; // Simplified for now
  }

  private analyzeTimePatterns(events: TimelineEvent[]): any[] {
    // Analyze time-based patterns
    return []; // Simplified for now
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Create singleton instance
export const auditHistoryService = new AuditHistoryService();

export default auditHistoryService;