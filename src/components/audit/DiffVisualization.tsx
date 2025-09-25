/**
 * Diff Visualization Component
 * Component for visualizing changes between old and new values
 */

import React, { useState, useMemo } from 'react';
import { DiffVisualization as DiffVisualizationType, DiffLine } from '../../types/auditHistory';
import { useDiffVisualization } from '../../hooks/useAuditHistory';

interface DiffVisualizationProps {
  eventId: string | null;
  showLineNumbers?: boolean;
  showWhitespace?: boolean;
  contextLines?: number;
  maxHeight?: string;
  onClose?: () => void;
}

export const DiffVisualization: React.FC<DiffVisualizationProps> = ({
  eventId,
  showLineNumbers = true,
  showWhitespace = false,
  contextLines = 3,
  maxHeight = '500px',
  onClose
}) => {
  const { diffs, loading, error } = useDiffVisualization(eventId);
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  if (!eventId) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading diff...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading diff</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!diffs || diffs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No changes to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Change Diff</h3>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unified
              </button>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Field Tabs */}
        {diffs.length > 1 && (
          <div className="mt-3 flex space-x-1 overflow-x-auto">
            {diffs.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDiff(diff.id)}
                className={`px-3 py-1 text-sm font-medium rounded whitespace-nowrap transition-colors ${
                  selectedDiff === diff.id || (!selectedDiff && diff === diffs[0])
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {diff.fieldDisplayName || diff.field}
                <span className="ml-1 text-xs">
                  ({getDiffTypeLabel(diff.diffType)})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Diff Content */}
      <div className="p-4" style={{ maxHeight, overflowY: 'auto' }}>
        {diffs.map((diff) => {
          const isSelected = selectedDiff === diff.id || (!selectedDiff && diff === diffs[0]);
          if (!isSelected) return null;

          return (
            <div key={diff.id}>
              {/* Diff Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {diff.fieldDisplayName || diff.field}
                  </h4>
                  <DiffTypeBadge type={diff.diffType} />
                </div>
                <DiffSummaryStats summary={diff.summary} />
              </div>

              {/* Diff View */}
              {viewMode === 'side-by-side' ? (
                <SideBySideDiff
                  diff={diff}
                  showLineNumbers={showLineNumbers}
                  showWhitespace={showWhitespace}
                />
              ) : (
                <UnifiedDiff
                  diff={diff}
                  showLineNumbers={showLineNumbers}
                  showWhitespace={showWhitespace}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Diff Type Badge
interface DiffTypeBadgeProps {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
}

const DiffTypeBadge: React.FC<DiffTypeBadgeProps> = ({ type }) => {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'removed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'modified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeStyles(type)}`}>
      {getDiffTypeLabel(type)}
    </span>
  );
};

// Diff Summary Stats
interface DiffSummaryStatsProps {
  summary: any;
}

const DiffSummaryStats: React.FC<DiffSummaryStatsProps> = ({ summary }) => {
  return (
    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
      {summary.addedLines > 0 && (
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          +{summary.addedLines} added
        </span>
      )}
      {summary.removedLines > 0 && (
        <span className="flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
          -{summary.removedLines} removed
        </span>
      )}
      {summary.modifiedLines > 0 && (
        <span className="flex items-center">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
          {summary.modifiedLines} modified
        </span>
      )}
    </div>
  );
};

// Side by Side Diff
interface SideBySideDiffProps {
  diff: DiffVisualizationType;
  showLineNumbers: boolean;
  showWhitespace: boolean;
}

const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  diff,
  showLineNumbers,
  showWhitespace
}) => {
  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const oldValue = formatValue(diff.oldValue);
  const newValue = formatValue(diff.newValue);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Old Value */}
      <div className="border border-gray-200 rounded-md">
        <div className="px-3 py-2 bg-red-50 border-b border-gray-200 text-sm font-medium text-red-800">
          Before
        </div>
        <div className="p-3">
          <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
            {oldValue}
          </pre>
        </div>
      </div>

      {/* New Value */}
      <div className="border border-gray-200 rounded-md">
        <div className="px-3 py-2 bg-green-50 border-b border-gray-200 text-sm font-medium text-green-800">
          After
        </div>
        <div className="p-3">
          <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
            {newValue}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Unified Diff
interface UnifiedDiffProps {
  diff: DiffVisualizationType;
  showLineNumbers: boolean;
  showWhitespace: boolean;
}

const UnifiedDiff: React.FC<UnifiedDiffProps> = ({
  diff,
  showLineNumbers,
  showWhitespace
}) => {
  const generateUnifiedDiff = useMemo(() => {
    const oldValue = diff.oldValue;
    const newValue = diff.newValue;

    // Simple unified diff generation
    const lines = [];
    
    if (oldValue !== null && oldValue !== undefined) {
      lines.push({
        type: 'removed' as const,
        content: `- ${String(oldValue)}`,
        lineNumber: 1
      });
    }
    
    if (newValue !== null && newValue !== undefined) {
      lines.push({
        type: 'added' as const,
        content: `+ ${String(newValue)}`,
        lineNumber: 2
      });
    }

    return lines;
  }, [diff]);

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {diff.fieldDisplayName || diff.field}
        </span>
      </div>
      
      <div className="bg-white">
        {generateUnifiedDiff.map((line, index) => (
          <div
            key={index}
            className={`flex ${
              line.type === 'added'
                ? 'bg-green-50'
                : line.type === 'removed'
                ? 'bg-red-50'
                : 'bg-white'
            }`}
          >
            {showLineNumbers && (
              <div className="w-12 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 text-right">
                {line.lineNumber}
              </div>
            )}
            <div className="flex-1 px-3 py-1">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {line.content}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
function getDiffTypeLabel(type: 'added' | 'removed' | 'modified' | 'unchanged'): string {
  switch (type) {
    case 'added': return 'Added';
    case 'removed': return 'Removed';
    case 'modified': return 'Modified';
    case 'unchanged': return 'Unchanged';
    default: return 'Unknown';
  }
}

export default DiffVisualization;