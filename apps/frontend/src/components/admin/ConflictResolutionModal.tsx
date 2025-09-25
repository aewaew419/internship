'use client';

import React from 'react';
import { PermissionConflict } from '@/types/admin';
import { AdminModal } from './AdminModal';
import { PermissionConflictDetector } from '@/lib/utils/permissionConflicts';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: PermissionConflict[];
  conflictDetector: PermissionConflictDetector;
  onResolve: (resolutionType: 'proceed' | 'cancel' | 'auto-resolve') => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  conflictDetector,
  onResolve
}) => {
  const errorConflicts = conflicts.filter(c => c.severity === 'error');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  const handleResolve = (type: 'proceed' | 'cancel' | 'auto-resolve') => {
    onResolve(type);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Permission Conflicts Detected"
      size="lg"
      type="warning"
    >
      <div className="space-y-6">
        {/* Error Conflicts */}
        {errorConflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center mb-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <h4 className="font-medium text-red-900">
                Critical Conflicts ({errorConflicts.length})
              </h4>
            </div>
            <div className="space-y-3">
              {errorConflicts.map((conflict, index) => (
                <div key={index} className="bg-white border border-red-200 rounded p-3">
                  <div className="font-medium text-red-800 mb-1">
                    {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Conflict
                  </div>
                  <div className="text-sm text-red-700 mb-2">
                    {conflict.message}
                  </div>
                  <div className="text-xs text-red-600">
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {conflictDetector.getConflictResolutions(conflict).map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Conflicts */}
        {warningConflicts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center mb-3">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <h4 className="font-medium text-yellow-900">
                Warnings ({warningConflicts.length})
              </h4>
            </div>
            <div className="space-y-3">
              {warningConflicts.map((conflict, index) => (
                <div key={index} className="bg-white border border-yellow-200 rounded p-3">
                  <div className="font-medium text-yellow-800 mb-1">
                    {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Warning
                  </div>
                  <div className="text-sm text-yellow-700 mb-2">
                    {conflict.message}
                  </div>
                  <div className="text-xs text-yellow-600">
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {conflictDetector.getConflictResolutions(conflict).map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Options */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-3">Resolution Options</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
              <div>
                <strong>Proceed Anyway:</strong> Continue with the change despite conflicts. 
                {errorConflicts.length > 0 && (
                  <span className="text-red-600"> (Not recommended due to critical conflicts)</span>
                )}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
              <div>
                <strong>Cancel:</strong> Cancel the permission change and keep current settings.
              </div>
            </div>
            {errorConflicts.length === 0 && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <div>
                  <strong>Auto-Resolve:</strong> Automatically resolve conflicts by applying suggested fixes.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => handleResolve('cancel')}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        
        {errorConflicts.length === 0 && (
          <button
            onClick={() => handleResolve('auto-resolve')}
            className="px-4 py-2 text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Auto-Resolve
          </button>
        )}
        
        <button
          onClick={() => handleResolve('proceed')}
          className={`px-4 py-2 text-white border border-transparent rounded-md focus:outline-none focus:ring-2 ${
            errorConflicts.length > 0
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {errorConflicts.length > 0 ? 'Proceed Anyway' : 'Proceed'}
        </button>
      </div>
    </AdminModal>
  );
};

export default ConflictResolutionModal;