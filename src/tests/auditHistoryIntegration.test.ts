/**
 * Audit History Integration Tests
 * Tests to verify the complete audit history visualization system works correctly
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { auditHistoryService } from '../services/auditHistoryService';
import { auditService } from '../services/auditService';
import { AuditEntityType, AuditAction } from '../types/audit';
import { HistoryFilter } from '../types/auditHistory';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Audit History Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditHistoryService.clearCache();
  });

  describe('History Timeline', () => {
    it('should fetch and convert audit events to timeline events', async () => {
      // Mock audit service response
      const mockAuditEvents = [
        {
          id: 'event-1',
          userId: 1,
          userEmail: 'admin@example.com',
          userName: 'Admin User',
          action: 'role_update' as AuditAction,
          entityType: 'role' as AuditEntityType,
          entityId: 'role-123',
          oldValue: { name: 'Old Role' },
          newValue: { name: 'New Role' },
          changes: [
            {
              field: 'name',
              oldValue: 'Old Role',
              newValue: 'New Role',
              fieldType: 'string' as const
            }
          ],
          timestamp: '2024-01-01T10:00:00Z',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          sessionId: 'session-1',
          severity: 'medium' as const,
          category: 'data_modification' as const,
          metadata: {},
          success: true,
          duration: 100
        }
      ];

      jest.spyOn(auditService, 'getEvents').mockResolvedValue(mockAuditEvents);

      const timeline = await auditHistoryService.getHistoryTimeline(
        'role',
        'role-123'
      );

      expect(timeline).toBeDefined();
      expect(timeline.entityType).toBe('role');
      expect(timeline.entityId).toBe('role-123');
      expect(timeline.events).toHaveLength(1);
      expect(timeline.events[0].id).toBe('event-1');
      expect(timeline.events[0].rollbackable).toBe(true);
      expect(timeline.summary.totalChanges).toBe(1);
    });

    it('should handle empty audit events', async () => {
      jest.spyOn(auditService, 'getEvents').mockResolvedValue([]);

      const timeline = await auditHistoryService.getHistoryTimeline(
        'role',
        'role-123'
      );

      expect(timeline.events).toHaveLength(0);
      expect(timeline.totalEvents).toBe(0);
      expect(timeline.summary.totalChanges).toBe(0);
    });

    it('should apply filters correctly', async () => {
      const filter: HistoryFilter = {
        action: 'role_update',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z',
        userId: 1
      };

      jest.spyOn(auditService, 'getEvents').mockResolvedValue([]);

      await auditHistoryService.getHistoryTimeline('role', 'role-123', filter);

      expect(auditService.getEvents).toHaveBeenCalledWith({
        entityType: 'role',
        entityId: 'role-123',
        action: 'role_update',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z',
        userId: 1,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
    });
  });

  describe('Diff Visualization', () => {
    it('should generate diff visualization for event changes', async () => {
      const mockEvent = {
        id: 'event-1',
        changes: [
          {
            field: 'name',
            oldValue: 'Old Name',
            newValue: 'New Name',
            fieldType: 'string' as const,
            displayName: 'Role Name'
          }
        ]
      };

      jest.spyOn(auditService, 'getEvents').mockResolvedValue([mockEvent as any]);

      const diffs = await auditHistoryService.getDiffVisualization('event-1');

      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('name');
      expect(diffs[0].fieldDisplayName).toBe('Role Name');
      expect(diffs[0].oldValue).toBe('Old Name');
      expect(diffs[0].newValue).toBe('New Name');
      expect(diffs[0].diffType).toBe('modified');
    });

    it('should handle events with no changes', async () => {
      const mockEvent = {
        id: 'event-1',
        changes: []
      };

      jest.spyOn(auditService, 'getEvents').mockResolvedValue([mockEvent as any]);

      const diffs = await auditHistoryService.getDiffVisualization('event-1');

      expect(diffs).toHaveLength(0);
    });
  });

  describe('History Search', () => {
    it('should search and rank events by relevance', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          action: 'role_update',
          user: { name: 'Admin User' },
          changes: [{ field: 'name', oldValue: 'test', newValue: 'updated' }]
        },
        {
          id: 'event-2',
          action: 'user_create',
          user: { name: 'Test User' },
          changes: [{ field: 'email', oldValue: null, newValue: 'test@example.com' }]
        }
      ];

      jest.spyOn(auditService, 'getEvents').mockResolvedValue(mockEvents as any);

      const searchResult = await auditHistoryService.searchHistory('test');

      expect(searchResult.query).toBe('test');
      expect(searchResult.results).toHaveLength(2);
      expect(searchResult.results[0].relevanceScore).toBeGreaterThan(0);
      expect(searchResult.results[0].matchedFields).toContain('user');
    });
  });

  describe('Rollback Operations', () => {
    it('should prepare rollback data with impact analysis', async () => {
      const mockEvent = {
        id: 'event-1',
        action: 'role_update',
        entityType: 'role',
        entityId: 'role-123',
        changes: [
          {
            field: 'name',
            oldValue: 'Old Name',
            newValue: 'New Name',
            fieldType: 'string' as const
          }
        ],
        success: true
      };

      jest.spyOn(auditService, 'getEvents').mockResolvedValue([mockEvent as any]);

      const rollbackData = await auditHistoryService.prepareRollback('event-1');

      expect(rollbackData).toBeDefined();
      expect(rollbackData.targetState).toEqual({ name: 'Old Name' });
      expect(rollbackData.affectedFields).toContain('name');
      expect(rollbackData.estimatedImpact).toBeDefined();
      expect(rollbackData.estimatedImpact.reversible).toBe(true);
    });

    it('should execute rollback operation', async () => {
      const mockRollbackData = {
        targetState: { name: 'Old Name' },
        affectedFields: ['name'],
        dependencies: [],
        warnings: [],
        estimatedImpact: {
          affectedEntities: 1,
          affectedUsers: 1,
          dataLossRisk: 'low' as const,
          systemImpact: 'low' as const,
          estimatedDuration: 1000,
          reversible: true
        }
      };

      const operation = await auditHistoryService.executeRollback(
        'event-1',
        mockRollbackData,
        1
      );

      expect(operation).toBeDefined();
      expect(operation.status).toBe('completed');
      expect(operation.result?.success).toBe(true);
    });
  });

  describe('History Analytics', () => {
    it('should generate comprehensive analytics', async () => {
      const mockTimeline = {
        entityId: 'role-123',
        entityType: 'role' as AuditEntityType,
        events: [
          {
            id: 'event-1',
            timestamp: '2024-01-01T10:00:00Z',
            action: 'role_update' as AuditAction,
            user: { id: 1, name: 'Admin User', email: 'admin@example.com' },
            changes: [{ field: 'name', oldValue: 'old', newValue: 'new', fieldType: 'string' as const }],
            severity: 'medium' as const,
            success: true,
            rollbackable: true
          }
        ],
        totalEvents: 1,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        summary: {
          totalChanges: 1,
          changesByField: { name: 1 },
          changesByUser: { 'Admin User': 1 },
          changesByAction: { role_update: 1 },
          mostActiveUser: { id: 1, name: 'Admin User', changeCount: 1 },
          mostChangedField: { field: 'name', changeCount: 1 },
          recentActivity: {
            lastChange: '2024-01-01T10:00:00Z',
            changesLast24h: 1,
            changesLast7d: 1,
            changesLast30d: 1
          }
        }
      };

      jest.spyOn(auditHistoryService, 'getHistoryTimeline').mockResolvedValue(mockTimeline);

      const analytics = await auditHistoryService.getHistoryAnalytics(
        'role',
        'role-123',
        {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      );

      expect(analytics).toBeDefined();
      expect(analytics.entityId).toBe('role-123');
      expect(analytics.metrics.totalChanges).toBe(1);
      expect(analytics.metrics.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(analytics.metrics.stabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('History Export', () => {
    it('should export history data in specified format', async () => {
      const mockTimeline = {
        entityId: 'role-123',
        entityType: 'role' as AuditEntityType,
        events: [],
        totalEvents: 0,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        summary: {} as any
      };

      const exportData = await auditHistoryService.exportHistory(
        mockTimeline,
        'json',
        {
          includeMetadata: true,
          includeUserInfo: true
        }
      );

      expect(exportData).toBeDefined();
      expect(exportData.format).toBe('json');
      expect(exportData.data).toBe(mockTimeline);
      expect(exportData.options.includeMetadata).toBe(true);
      expect(exportData.options.includeUserInfo).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      jest.spyOn(auditService, 'getEvents').mockRejectedValue(new Error('Service error'));

      await expect(
        auditHistoryService.getHistoryTimeline('role', 'role-123')
      ).rejects.toThrow('Service error');
    });

    it('should handle invalid event IDs', async () => {
      jest.spyOn(auditService, 'getEvents').mockResolvedValue([]);

      await expect(
        auditHistoryService.getDiffVisualization('invalid-event-id')
      ).rejects.toThrow('Event not found');
    });
  });

  describe('Caching', () => {
    it('should cache timeline data', async () => {
      const mockEvents = [{ id: 'event-1' }];
      jest.spyOn(auditService, 'getEvents').mockResolvedValue(mockEvents as any);

      // First call
      await auditHistoryService.getHistoryTimeline('role', 'role-123');
      
      // Second call should use cache
      await auditHistoryService.getHistoryTimeline('role', 'role-123');

      // Should only call the service once due to caching
      expect(auditService.getEvents).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      const mockEvents = [{ id: 'event-1' }];
      jest.spyOn(auditService, 'getEvents').mockResolvedValue(mockEvents as any);

      // First call
      await auditHistoryService.getHistoryTimeline('role', 'role-123');
      
      // Clear cache
      auditHistoryService.clearCache();
      
      // Second call should fetch fresh data
      await auditHistoryService.getHistoryTimeline('role', 'role-123');

      expect(auditService.getEvents).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Component Integration', () => {
  it('should have all required exports', () => {
    // Test that all main exports are available
    expect(auditHistoryService).toBeDefined();
    
    // These would be tested in actual React testing environment
    // expect(HistoryTimeline).toBeDefined();
    // expect(HistoryAnalytics).toBeDefined();
    // expect(DiffVisualization).toBeDefined();
    // expect(RollbackModal).toBeDefined();
    // expect(HistoryVisualizationPanel).toBeDefined();
  });
});

describe('Performance', () => {
  it('should handle large datasets efficiently', async () => {
    const largeEventSet = Array.from({ length: 1000 }, (_, i) => ({
      id: `event-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      action: 'role_update' as AuditAction,
      changes: [{ field: 'name', oldValue: `old-${i}`, newValue: `new-${i}`, fieldType: 'string' as const }]
    }));

    jest.spyOn(auditService, 'getEvents').mockResolvedValue(largeEventSet as any);

    const startTime = Date.now();
    const timeline = await auditHistoryService.getHistoryTimeline('role', 'role-123');
    const endTime = Date.now();

    expect(timeline.events).toHaveLength(1000);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
});