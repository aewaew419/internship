/**
 * History Visualization Panel
 * Main component that combines all history visualization features
 */

import React, { useState } from 'react';
import { AuditEntityType } from '../../types/audit';
import { TimelineEvent } from '../../types/auditHistory';
import HistoryTimeline from './HistoryTimeline';
import HistoryAnalytics from './HistoryAnalytics';
import DiffVisualization from './DiffVisualization';
import RollbackModal from './RollbackModal';

interface HistoryVisualizationPanelProps {
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  defaultView?: 'timeline' | 'analytics';
  showAnalytics?: boolean;
  showRollback?: boolean;
  maxHeight?: string;
}

export const HistoryVisualizationPanel: React.FC<HistoryVisualizationPanelProps> = ({
  entityType,
  entityId,
  entityName,
  defaultView = 'timeline',
  showAnalytics = true,
  showRollback = true,
  maxHeight = '800px'
}) => {
  const [activeView, setActiveView] = useState<'timeline' | 'analytics'>(defaultView);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
    end: new Date().toISOString()
  });

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowDiff(true);
  };

  const handleRollbackClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowRollbackModal(true);
  };

  const handleRollbackSuccess = () => {
    setShowRollbackModal(false);
    setSelectedEvent(null);
    // Refresh timeline data
    window.location.reload(); // Simple refresh - in real app would use proper state management
  };

  const handleRollbackError = (error: string) => {
    console.error('Rollback error:', error);
    // Show error notification
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                History & Analytics
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {entityName ? `${entityName} (${entityType}: ${entityId})` : `${entityType}: ${entityId}`}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('timeline')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'timeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Timeline</span>
                </div>
              </button>
              
              {showAnalytics && (
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'analytics'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analytics</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxHeight, overflowY: 'auto' }}>
        {activeView === 'timeline' && (
          <HistoryTimeline
            entityType={entityType}
            entityId={entityId}
            showFilters={true}
            showGrouping={true}
            compactMode={false}
            onEventClick={handleEventClick}
            onRollbackClick={showRollback ? handleRollbackClick : undefined}
          />
        )}

        {activeView === 'analytics' && showAnalytics && (
          <HistoryAnalytics
            entityType={entityType}
            entityId={entityId}
            period={analyticsPeriod}
            onPeriodChange={setAnalyticsPeriod}
          />
        )}
      </div>

      {/* Diff Modal */}
      {showDiff && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDiff(false)}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Change Details
                  </h3>
                  <button
                    onClick={() => setShowDiff(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Event Summary */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Action:</span>
                      <span className="ml-1 text-gray-900">{selectedEvent.action.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">User:</span>
                      <span className="ml-1 text-gray-900">{selectedEvent.user.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Time:</span>
                      <span className="ml-1 text-gray-900">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-1 ${selectedEvent.success ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedEvent.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                <DiffVisualization
                  eventId={selectedEvent.id}
                  showLineNumbers={true}
                  showWhitespace={false}
                  maxHeight="400px"
                />
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {showRollback && selectedEvent.rollbackable && (
                  <button
                    onClick={() => {
                      setShowDiff(false);
                      handleRollbackClick(selectedEvent);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Rollback
                  </button>
                )}
                <button
                  onClick={() => setShowDiff(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Modal */}
      <RollbackModal
        isOpen={showRollbackModal}
        event={selectedEvent}
        onClose={() => {
          setShowRollbackModal(false);
          setSelectedEvent(null);
        }}
        onSuccess={handleRollbackSuccess}
        onError={handleRollbackError}
      />
    </div>
  );
};

export default HistoryVisualizationPanel;