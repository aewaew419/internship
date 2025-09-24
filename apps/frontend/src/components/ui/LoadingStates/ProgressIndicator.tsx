'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LoadingIndicator } from './AuthLoadingStates';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Progress indicator for multi-step registration process
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels = [],
  isLoading = false,
  className = '',
}: ProgressIndicatorProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Step labels */}
      {stepLabels.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          {stepLabels.map((label, index) => (
            <span
              key={index}
              className={`font-medium transition-colors duration-200 ${
                index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-500'
              } ${isMobile ? 'text-base' : 'text-sm'}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="relative">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${isMobile ? 'h-3' : 'h-2'}`}>
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-in-out relative"
            style={{ width: `${progress}%` }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            )}
          </div>
        </div>
        
        {/* Step indicators */}
        <div className="absolute top-0 left-0 w-full flex justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`${isMobile ? 'w-3 h-3 -mt-0.5' : 'w-2 h-2 -mt-0'} rounded-full border-2 transition-colors duration-200 ${
                index + 1 <= currentStep
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress text */}
      <div className={`text-center mt-2 ${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>
        ขั้นตอนที่ {currentStep} จาก {totalSteps}
        {isLoading && (
          <span className="ml-2 inline-flex items-center">
            <LoadingIndicator size="sm" variant="dots" />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Enhanced progress indicator with step descriptions
 */
export function EnhancedProgressIndicator({
  currentStep,
  totalSteps,
  steps,
  isLoading = false,
  className = '',
}: {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  isLoading?: boolean;
  className?: string;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Steps with icons and descriptions */}
      <div className={`grid grid-cols-${totalSteps} gap-2 mb-4`}>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`text-center transition-all duration-200 ${
              index + 1 <= currentStep ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {/* Step icon */}
            <div
              className={`${isMobile ? 'w-10 h-10 mb-2' : 'w-8 h-8 mb-1'} mx-auto rounded-full flex items-center justify-center transition-colors duration-200 ${
                index + 1 <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.icon || (
                <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  {index + 1}
                </span>
              )}
            </div>
            
            {/* Step label */}
            <p className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'} ${
              index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {step.label}
            </p>
            
            {/* Step description */}
            {step.description && (
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 mt-1`}>
                {step.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative mb-2">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${isMobile ? 'h-2' : 'h-1.5'}`}>
          <div
            className="bg-blue-600 h-full transition-all duration-500 ease-in-out relative"
            style={{ width: `${progress}%` }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Current step info */}
      <div className={`text-center ${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>
        {isLoading ? (
          <span className="inline-flex items-center space-x-2">
            <span>กำลังดำเนินการ...</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </div>
          </span>
        ) : (
          `ขั้นตอนที่ ${currentStep} จาก ${totalSteps}`
        )}
      </div>
    </div>
  );
}

/**
 * Multi-step registration progress indicator with enhanced animations
 */
export function MultiStepRegistrationProgress({
  currentStep,
  steps,
  isLoading = false,
  hasError = false,
  className = '',
}: {
  currentStep: number;
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    isCompleted?: boolean;
    hasError?: boolean;
  }>;
  isLoading?: boolean;
  hasError?: boolean;
  className?: string;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const totalSteps = steps.length;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Step indicators */}
      <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'} mb-6`}>
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = step.isCompleted || index + 1 < currentStep;
          const stepHasError = step.hasError || (hasError && isActive);
          
          return (
            <div
              key={step.id}
              className={`${isMobile ? 'flex items-center space-x-3' : 'flex flex-col items-center text-center'} transition-all duration-300`}
            >
              {/* Step circle */}
              <div className="relative">
                <div
                  className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center transition-all duration-300 ${
                    stepHasError
                      ? 'bg-red-100 border-2 border-red-500 text-red-600'
                      : isCompleted
                      ? 'bg-green-100 border-2 border-green-500 text-green-600'
                      : isActive
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-600'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {stepHasError ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    <span className="font-semibold text-xs">{index + 1}</span>
                  )}
                </div>
                
                {/* Loading ring for active step */}
                {isActive && isLoading && !stepHasError && (
                  <div className="absolute -inset-1 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
                )}
              </div>

              {/* Step content */}
              <div className={`${isMobile ? 'flex-1' : 'mt-2'}`}>
                <p className={`font-medium transition-colors duration-200 ${
                  stepHasError
                    ? 'text-red-600'
                    : isCompleted
                    ? 'text-green-600'
                    : isActive
                    ? 'text-blue-600'
                    : 'text-gray-500'
                } ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  {step.label}
                </p>
                
                {step.description && (
                  <p className={`text-gray-400 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connection line (desktop only) */}
              {!isMobile && index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-2 mt-5">
                  <div
                    className={`h-full transition-all duration-500 ease-in-out ${
                      stepHasError ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{ width: index + 1 < currentStep ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${isMobile ? 'h-2' : 'h-1.5'}`}>
          <div
            className={`h-full transition-all duration-500 ease-in-out relative ${
              hasError ? 'bg-red-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%` }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className={`text-center ${isMobile ? 'text-sm' : 'text-xs'} ${hasError ? 'text-red-600' : 'text-gray-600'}`}>
        {hasError ? (
          <span className="inline-flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>เกิดข้อผิดพลาดในขั้นตอนที่ {currentStep}</span>
          </span>
        ) : isLoading ? (
          <span className="inline-flex items-center space-x-2">
            <span>กำลังดำเนินการขั้นตอนที่ {currentStep}...</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </div>
          </span>
        ) : (
          `ขั้นตอนที่ ${currentStep} จาก ${totalSteps}`
        )}
      </div>
    </div>
  );
}