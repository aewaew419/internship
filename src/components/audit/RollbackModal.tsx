/**
 * Rollback Modal Component
 * Modal for handling rollback operations with warnings and confirmations
 */

import React, { useState, useEffect } from 'react';
import { 
  TimelineEvent, 
  RollbackData, 
  RollbackOperation, 
  RollbackWarning,
  RollbackDependency 
} from '../../types/auditHistory';
import { useRollback } from '../../hooks/useAuditHistory';

interface RollbackModalProps {
  isOpen: boolean;
  event: TimelineEvent | null;
  onClose: () => void;
  onSuccess?: (operation: RollbackOperation) => void;
  onError?: (error: string) => void;
}

export const RollbackModal: React.FC<RollbackModalProps> = ({
  isOpen,
  event,
  onClose,
  onSuccess,
  onError
}) => {
  const { rollbackData, operation, loading, error, prepareRollback, executeRollback, clearRollback } = useRollback();
  const [step, setStep] = useState<'prepare' | 'confirm' | 'executing' | 'complete'>('prepare');
  const [acceptedWarnings, setAcceptedWarnings] = useState<Set<string>>(new Set());
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      setStep('prepare');
      setAcceptedWarnings(new Set());
      setConfirmationText('');
      prepareRollback(event.id);
    } else if (!isOpen) {
      clearRollback();
    }
  }, [isOpen, event, prepareRollback, clearRollback]);

  useEffect(() => {
    if (rollbackData && step === 'prepare') {
      setStep('confirm');
    }
  }, [rollbackData, step]);

  useEffect(() => {
    if (operation) {
      if (operation.status === 'completed') {
        setStep('complete');
        onSuccess?.(operation);
      } else if (operation.status === 'failed') {
        onError?.(operation.error || 'Rollback failed');
      }
    }
  }, [operation, onSuccess, onError]);

  const handleExecuteRollback = async () => {
    if (!event || !rollbackData) return;

    setStep('executing');
    try {
      await executeRollback(event.id, rollbackData, 1); // Would get actual user ID from context
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Rollback failed');
      setStep('confirm');
    }
  };

  const handleWarningAcceptance = (warningType: string, accepted: boolean) => {
    const newAccepted = new Set(acceptedWarnings);
    if (accepted) {
      newAccepted.add(warningType);
    } else {
      newAccepted.delete(warningType);
    }
    setAcceptedWarnings(newAccepted);
  };

  const canProceed = () => {
    if (!rollbackData) return false;
    
    // Check if all critical warnings are accepted
    const criticalWarnings = rollbackData.warnings.filter(w => w.severity === 'critical');
    const allCriticalAccepted = criticalWarnings.every(w => acceptedWarnings.has(w.type));
    
    // Check confirmation text for high-risk operations
    const requiresConfirmation = rollbackData.estimatedImpact.dataLossRisk === 'high' || 
                                rollbackData.estimatedImpact.systemImpact === 'high';
    const confirmationValid = !requiresConfirmation || confirmationText === 'CONFIRM ROLLBACK';
    
    return allCriticalAccepted && confirmationValid;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Rollback Operation
                </h3>
                <p className="text-sm text-gray-500">
                  {event && `Rolling back: ${event.action.replace(/_/g, ' ').toUpperCase()}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mt-4">
            {step === 'prepare' && (
              <PreparationStep loading={loading} error={error} />
            )}

            {step === 'confirm' && rollbackData && (
              <ConfirmationStep
                event={event!}
                rollbackData={rollbackData}
                acceptedWarnings={acceptedWarnings}
                confirmationText={confirmationText}
                onWarningAcceptance={handleWarningAcceptance}
                onConfirmationTextChange={setConfirmationText}
              />
            )}

            {step === 'executing' && (
              <ExecutingStep />
            )}

            {step === 'complete' && operation && (
              <CompleteStep operation={operation} />
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            {step === 'confirm' && (
              <>
                <button
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteRollback}
                  disabled={!canProceed()}
                  className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Execute Rollback
                </button>
              </>
            )}

            {step === 'complete' && (
              <button
                onClick={onClose}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            )}

            {(step === 'prepare' || step === 'executing') && (
              <button
                onClick={onClose}
                disabled={step === 'executing'}
                className="bg-gray-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'executing' ? 'Please wait...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Preparation Step
interface PreparationStepProps {
  loading: boolean;
  error: string | null;
}

const PreparationStep: React.FC<PreparationStepProps> = ({ loading, error }) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error preparing rollback</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Preparing rollback operation...</p>
      <p className="mt-1 text-xs text-gray-500">Analyzing dependencies and impact</p>
    </div>
  );
};

// Confirmation Step
interface ConfirmationStepProps {
  event: TimelineEvent;
  rollbackData: RollbackData;
  acceptedWarnings: Set<string>;
  confirmationText: string;
  onWarningAcceptance: (type: string, accepted: boolean) => void;
  onConfirmationTextChange: (text: string) => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  event,
  rollbackData,
  acceptedWarnings,
  confirmationText,
  onWarningAcceptance,
  onConfirmationTextChange
}) => {
  const requiresConfirmation = rollbackData.estimatedImpact.dataLossRisk === 'high' || 
                              rollbackData.estimatedImpact.systemImpact === 'high';

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Event to Rollback</h4>
        <div className="text-sm text-gray-600">
          <p><strong>Action:</strong> {event.action.replace(/_/g, ' ').toUpperCase()}</p>
          <p><strong>User:</strong> {event.user.name}</p>
          <p><strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}</p>
          <p><strong>Changes:</strong> {event.changes.length} field(s)</p>
        </div>
      </div>

      {/* Impact Analysis */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Impact Analysis</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Affected Entities:</span>
            <span className="ml-1 text-blue-700">{rollbackData.estimatedImpact.affectedEntities}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Affected Users:</span>
            <span className="ml-1 text-blue-700">{rollbackData.estimatedImpact.affectedUsers}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Data Loss Risk:</span>
            <span className={`ml-1 ${getRiskColor(rollbackData.estimatedImpact.dataLossRisk)}`}>
              {rollbackData.estimatedImpact.dataLossRisk.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">System Impact:</span>
            <span className={`ml-1 ${getRiskColor(rollbackData.estimatedImpact.systemImpact)}`}>
              {rollbackData.estimatedImpact.systemImpact.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {rollbackData.warnings.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Warnings</h4>
          {rollbackData.warnings.map((warning, index) => (
            <WarningCard
              key={index}
              warning={warning}
              accepted={acceptedWarnings.has(warning.type)}
              onAcceptanceChange={(accepted) => onWarningAcceptance(warning.type, accepted)}
            />
          ))}
        </div>
      )}

      {/* Dependencies */}
      {rollbackData.dependencies.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Dependencies</h4>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-2">
              This rollback will affect the following related entities:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {rollbackData.dependencies.map((dep, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  {dep.entityType} "{dep.entityName || dep.entityId}" - {dep.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Target State Preview */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Target State</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">After rollback, the following values will be restored:</p>
          <div className="space-y-2">
            {rollbackData.affectedFields.map((field) => (
              <div key={field} className="text-sm">
                <span className="font-medium text-gray-700">{field}:</span>
                <span className="ml-1 text-gray-600 font-mono">
                  {JSON.stringify(rollbackData.targetState[field])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Input */}
      {requiresConfirmation && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Confirmation Required</h4>
          <p className="text-sm text-red-700 mb-3">
            This is a high-risk operation. Please type <strong>CONFIRM ROLLBACK</strong> to proceed:
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => onConfirmationTextChange(e.target.value)}
            placeholder="Type CONFIRM ROLLBACK"
            className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      )}
    </div>
  );
};

// Warning Card
interface WarningCardProps {
  warning: RollbackWarning;
  accepted: boolean;
  onAcceptanceChange: (accepted: boolean) => void;
}

const WarningCard: React.FC<WarningCardProps> = ({ warning, accepted, onAcceptanceChange }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'high': return 'border-orange-300 bg-orange-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-blue-300 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(warning.severity)}`}>
      <div className="flex items-start">
        <span className="text-lg mr-2">{getSeverityIcon(warning.severity)}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900">
              {warning.type.replace(/_/g, ' ').toUpperCase()}
            </h5>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              warning.severity === 'critical' ? 'bg-red-100 text-red-800' :
              warning.severity === 'high' ? 'bg-orange-100 text-orange-800' :
              warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {warning.severity.toUpperCase()}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">{warning.message}</p>
          
          {warning.recommendation && (
            <p className="text-sm text-gray-600 italic mb-3">
              <strong>Recommendation:</strong> {warning.recommendation}
            </p>
          )}

          {warning.severity === 'critical' && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => onAcceptanceChange(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                I understand and accept this risk
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

// Executing Step
const ExecutingStep: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Executing rollback operation...</p>
      <p className="mt-1 text-xs text-gray-500">Please do not close this window</p>
    </div>
  );
};

// Complete Step
interface CompleteStepProps {
  operation: RollbackOperation;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ operation }) => {
  const isSuccess = operation.status === 'completed' && operation.result?.success;

  return (
    <div className="text-center py-8">
      <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
        isSuccess ? 'bg-green-100' : 'bg-red-100'
      }`}>
        {isSuccess ? (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      
      <h3 className={`mt-4 text-lg font-medium ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
        {isSuccess ? 'Rollback Completed' : 'Rollback Failed'}
      </h3>
      
      <p className="mt-2 text-sm text-gray-600">
        {operation.result?.summary || operation.error || 'Operation completed'}
      </p>

      {operation.result && (
        <div className="mt-4 text-left bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Operation Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Duration:</strong> {operation.result.duration}ms</p>
            <p><strong>Affected Entities:</strong> {operation.result.affectedEntities.length}</p>
            {operation.result.warnings.length > 0 && (
              <p><strong>Warnings:</strong> {operation.result.warnings.length}</p>
            )}
            {operation.result.errors.length > 0 && (
              <p><strong>Errors:</strong> {operation.result.errors.length}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getRiskColor(risk: string): string {
  switch (risk) {
    case 'high': return 'text-red-700';
    case 'medium': return 'text-yellow-700';
    case 'low': return 'text-green-700';
    default: return 'text-gray-700';
  }
}

export default RollbackModal;