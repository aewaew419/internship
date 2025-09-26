import React from 'react';
import { EvaluationStatus } from './EvaluationStatus';

/**
 * Example usage of the EvaluationStatus component
 * This file demonstrates different use cases and can be used for testing
 */
export const EvaluationStatusExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-secondary-600">EvaluationStatus Component Examples</h2>
      
      {/* Basic usage - evaluation completed */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Basic Status (Evaluated)</h3>
        <EvaluationStatus isEvaluated={true} />
      </div>

      {/* With timestamp */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">With Timestamp</h3>
        <EvaluationStatus 
          isEvaluated={true} 
          evaluationDate={new Date('2024-01-15T10:30:00')}
          showTimestamp={true}
        />
      </div>

      {/* Not evaluated (should not render) */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Not Evaluated (No Display)</h3>
        <EvaluationStatus isEvaluated={false} />
        <p className="text-gray-500 text-sm">Component returns null when isEvaluated is false</p>
      </div>

      {/* With custom className */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">With Custom Styling</h3>
        <EvaluationStatus 
          isEvaluated={true} 
          evaluationDate="2024-02-20T14:45:00"
          showTimestamp={true}
          className="justify-center"
        />
      </div>
    </div>
  );
};

export default EvaluationStatusExamples;