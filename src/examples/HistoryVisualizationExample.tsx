/**
 * History Visualization Example
 * Example component showing how to use the audit history visualization system
 */

import React, { useState } from 'react';
import { 
  HistoryVisualizationPanel,
  AuditProvider,
  initializeAuditSystem
} from '../audit';
import { AuditEntityType } from '../types/audit';

// Initialize audit system
initializeAuditSystem('development', {
  id: 1,
  email: 'admin@example.com',
  name: 'Admin User'
});

export const HistoryVisualizationExample: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<{
    type: AuditEntityType;
    id: string;
    name: string;
  }>({
    type: 'role',
    id: 'role-123',
    name: 'Administrator Role'
  });

  const entities = [
    { type: 'role' as AuditEntityType, id: 'role-123', name: 'Administrator Role' },
    { type: 'role' as AuditEntityType, id: 'role-456', name: 'Editor Role' },
    { type: 'semester' as AuditEntityType, id: 'sem-2024-1', name: 'Spring 2024' },
    { type: 'holiday' as AuditEntityType, id: 'holiday-ny-2024', name: 'New Year 2024' },
    { type: 'title_prefix' as AuditEntityType, id: 'prefix-dr', name: 'Dr. Prefix' },
    { type: 'system_settings' as AuditEntityType, id: 'settings-main', name: 'Main Settings' }
  ];

  return (
    <AuditProvider
      config={{
        enabled: true,
        retentionDays: 90,
        logLevel: 'low',
        enablePerformanceTracking: true,
        enableSuspiciousActivityDetection: true
      }}
      user={{
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User'
      }}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Audit History Visualization
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive history tracking and visualization for administrative operations
            </p>
          </div>

          {/* Entity Selector */}
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Select Entity to View History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map((entity) => (
                <button
                  key={`${entity.type}-${entity.id}`}
                  onClick={() => setSelectedEntity(entity)}
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    selectedEntity.type === entity.type && selectedEntity.id === entity.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getEntityIcon(entity.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{entity.name}</p>
                      <p className="text-sm text-gray-500">
                        {entity.type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* History Visualization Panel */}
          <HistoryVisualizationPanel
            entityType={selectedEntity.type}
            entityId={selectedEntity.id}
            entityName={selectedEntity.name}
            defaultView="timeline"
            showAnalytics={true}
            showRollback={true}
            maxHeight="800px"
          />

          {/* Feature Showcase */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🕒"
              title="Timeline View"
              description="Visual timeline of all changes with user attribution, timestamps, and change details"
              features={[
                'Chronological event display',
                'User avatars and attribution',
                'Change summaries',
                'Success/failure indicators',
                'Grouping by date, user, or action'
              ]}
            />

            <FeatureCard
              icon="📊"
              title="Analytics Dashboard"
              description="Comprehensive analytics and insights about change patterns and user behavior"
              features={[
                'Change frequency metrics',
                'User activity patterns',
                'Stability scoring',
                'Trend analysis',
                'Peak activity identification'
              ]}
            />

            <FeatureCard
              icon="🔄"
              title="Rollback Operations"
              description="Safe rollback functionality with dependency analysis and impact assessment"
              features={[
                'Dependency detection',
                'Impact analysis',
                'Warning system',
                'Confirmation workflows',
                'Rollback history tracking'
              ]}
            />

            <FeatureCard
              icon="🔍"
              title="Diff Visualization"
              description="Side-by-side and unified diff views for understanding exactly what changed"
              features={[
                'Before/after comparison',
                'Syntax highlighting',
                'Line-by-line changes',
                'Multiple view modes',
                'Change statistics'
              ]}
            />

            <FeatureCard
              icon="🔎"
              title="Advanced Search"
              description="Powerful search and filtering capabilities across all audit data"
              features={[
                'Full-text search',
                'Multi-criteria filtering',
                'Date range selection',
                'User-specific filtering',
                'Action-based filtering'
              ]}
            />

            <FeatureCard
              icon="📈"
              title="Real-time Updates"
              description="Live updates and notifications for new audit events and suspicious activities"
              features={[
                'Live event streaming',
                'New event notifications',
                'Suspicious activity alerts',
                'Auto-refresh capabilities',
                'Connection status indicators'
              ]}
            />
          </div>

          {/* Usage Examples */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Usage Examples
            </h2>
            <div className="space-y-4">
              <UsageExample
                title="Basic Timeline View"
                code={`import { HistoryTimeline } from './audit';

<HistoryTimeline
  entityType="role"
  entityId="role-123"
  showFilters={true}
  onEventClick={(event) => console.log('Event clicked:', event)}
/>`}
              />

              <UsageExample
                title="Analytics Dashboard"
                code={`import { HistoryAnalytics } from './audit';

<HistoryAnalytics
  entityType="role"
  entityId="role-123"
  period={{
    start: '2024-01-01T00:00:00Z',
    end: '2024-12-31T23:59:59Z'
  }}
/>`}
              />

              <UsageExample
                title="Complete Visualization Panel"
                code={`import { HistoryVisualizationPanel } from './audit';

<HistoryVisualizationPanel
  entityType="role"
  entityId="role-123"
  entityName="Administrator Role"
  showAnalytics={true}
  showRollback={true}
/>`}
              />
            </div>
          </div>
        </div>
      </div>
    </AuditProvider>
  );
};

// Helper Components
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, features }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface UsageExampleProps {
  title: string;
  code: string;
}

const UsageExample: React.FC<UsageExampleProps> = ({ title, code }) => {
  return (
    <div>
      <h3 className="text-md font-medium text-gray-900 mb-2">{title}</h3>
      <pre className="bg-gray-100 rounded-md p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Helper function
function getEntityIcon(entityType: AuditEntityType): React.ReactNode {
  const iconMap = {
    role: '👥',
    permission: '🔐',
    user: '👤',
    semester: '📅',
    holiday: '🎉',
    academic_calendar: '📆',
    title_prefix: '🏷️',
    prefix_assignment: '📝',
    system_settings: '⚙️',
    session: '🔗',
    bulk_operation: '📦',
    module: '🧩'
  };

  return (
    <span className="text-2xl">
      {iconMap[entityType] || '📋'}
    </span>
  );
}

export default HistoryVisualizationExample;