'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SkeletonLoadingProps {
  variant?: 'form' | 'input' | 'button' | 'card';
  count?: number;
  className?: string;
}

/**
 * Skeleton loading states for form components during initialization
 */
export function SkeletonLoading({
  variant = 'form',
  count = 1,
  className = '',
}: SkeletonLoadingProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const renderFormSkeleton = () => (
    <div className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'} ${className}`}>
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className={`bg-gray-200 rounded-full mx-auto animate-pulse ${isMobile ? 'w-20 h-20' : 'w-16 h-16'}`} />
        <div className={`bg-gray-200 rounded mx-auto animate-pulse ${isMobile ? 'h-8 w-48' : 'h-6 w-40'}`} />
        <div className={`bg-gray-200 rounded mx-auto animate-pulse ${isMobile ? 'h-6 w-64' : 'h-4 w-56'}`} />
      </div>
      
      {/* Form fields skeleton */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-5 w-24' : 'h-4 w-20'}`} />
          <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'}`} />
        </div>
      ))}
      
      {/* Button skeleton */}
      <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full mt-8' : 'h-12 w-full mt-6'}`} />
    </div>
  );

  const renderInputSkeleton = () => (
    <div className={`space-y-2 ${className}`}>
      <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-5 w-24' : 'h-4 w-20'}`} />
      <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'}`} />
    </div>
  );

  const renderButtonSkeleton = () => (
    <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'} ${className}`} />
  );

  const renderCardSkeleton = () => (
    <div className={`bg-white rounded-lg shadow-sm border p-6 space-y-4 ${className}`}>
      <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-6 w-3/4' : 'h-5 w-2/3'}`} />
      <div className="space-y-2">
        <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-4 w-full' : 'h-3 w-full'}`} />
        <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-4 w-5/6' : 'h-3 w-4/5'}`} />
        <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-4 w-2/3' : 'h-3 w-1/2'}`} />
      </div>
    </div>
  );

  switch (variant) {
    case 'input':
      return renderInputSkeleton();
    case 'button':
      return renderButtonSkeleton();
    case 'card':
      return renderCardSkeleton();
    default:
      return renderFormSkeleton();
  }
}

/**
 * Enhanced authentication form skeleton with realistic loading patterns
 */
export function AuthFormSkeleton({
  formType = 'login',
  showProgress = false,
  className = '',
}: {
  formType?: 'login' | 'register' | 'admin';
  showProgress?: boolean;
  className?: string;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getFieldCount = () => {
    switch (formType) {
      case 'register':
        return 5; // name, student_id, email, password, confirm_password
      case 'admin':
        return 2; // email, password
      default:
        return 2; // student_id/email, password
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Logo/Header skeleton */}
      <div className="text-center mb-8">
        <div className={`bg-gray-200 rounded-full mx-auto animate-pulse mb-4 ${isMobile ? 'w-20 h-20' : 'w-16 h-16'}`} />
        <div className={`bg-gray-200 rounded mx-auto animate-pulse mb-2 ${isMobile ? 'h-8 w-48' : 'h-6 w-40'}`} />
        <div className={`bg-gray-200 rounded mx-auto animate-pulse ${isMobile ? 'h-6 w-64' : 'h-4 w-56'}`} />
      </div>

      {/* Progress indicator skeleton (for multi-step forms) */}
      {showProgress && (
        <div className="mb-6">
          <div className={`bg-gray-200 rounded-full animate-pulse ${isMobile ? 'h-3' : 'h-2'} mb-2`} />
          <div className="flex justify-between">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-4 w-16' : 'h-3 w-12'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Form fields skeleton */}
      <div className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
        {Array.from({ length: getFieldCount() }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-5 w-24' : 'h-4 w-20'}`} />
            <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'}`} />
          </div>
        ))}

        {/* Additional elements for register form */}
        {formType === 'register' && (
          <div className="space-y-3">
            <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-5 w-full' : 'h-4 w-3/4'}`} />
            <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-4 w-5/6' : 'h-3 w-2/3'}`} />
          </div>
        )}

        {/* Submit button skeleton */}
        <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full mt-8' : 'h-12 w-full mt-6'}`} />

        {/* Additional links skeleton */}
        <div className="text-center space-y-2 mt-4">
          <div className={`bg-gray-200 rounded mx-auto animate-pulse ${isMobile ? 'h-5 w-32' : 'h-4 w-28'}`} />
          {formType !== 'admin' && (
            <div className={`bg-gray-200 rounded mx-auto animate-pulse ${isMobile ? 'h-5 w-40' : 'h-4 w-36'}`} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer effect skeleton for better visual feedback
 */
export function ShimmerSkeleton({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = true,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`bg-gray-200 animate-pulse relative overflow-hidden ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white to-transparent opacity-60" />
    </div>
  );
}

/**
 * Enhanced form initialization skeleton with realistic loading patterns
 */
export function FormInitializationSkeleton({
  formType = 'login',
  showValidationStates = false,
  className = '',
}: {
  formType?: 'login' | 'register' | 'admin';
  showValidationStates?: boolean;
  className?: string;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getFieldConfigs = () => {
    switch (formType) {
      case 'register':
        return [
          { label: 'ชื่อ', hasValidation: true },
          { label: 'นามสกุล', hasValidation: true },
          { label: 'รหัสนักศึกษา', hasValidation: true },
          { label: 'อีเมล', hasValidation: true },
          { label: 'รหัสผ่าน', hasValidation: true },
          { label: 'ยืนยันรหัสผ่าน', hasValidation: true },
        ];
      case 'admin':
        return [
          { label: 'อีเมล', hasValidation: true },
          { label: 'รหัสผ่าน', hasValidation: false },
        ];
      default:
        return [
          { label: 'รหัสนักศึกษา', hasValidation: true },
          { label: 'รหัสผ่าน', hasValidation: false },
        ];
    }
  };

  const fields = getFieldConfigs();

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Logo/Header skeleton with staggered animation */}
      <div className="text-center mb-8">
        <ShimmerSkeleton
          width={isMobile ? '80px' : '64px'}
          height={isMobile ? '80px' : '64px'}
          className={`mx-auto mb-4 rounded-full`}
        />
        <ShimmerSkeleton
          width={isMobile ? '192px' : '160px'}
          height={isMobile ? '32px' : '24px'}
          className="mx-auto mb-2"
        />
        <ShimmerSkeleton
          width={isMobile ? '256px' : '224px'}
          height={isMobile ? '24px' : '16px'}
          className="mx-auto"
        />
      </div>

      {/* Form fields skeleton with realistic timing */}
      <div className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
        {fields.map((field, index) => (
          <div key={index} className="space-y-2">
            {/* Field label */}
            <ShimmerSkeleton
              width={field.label.length * 8 + 'px'}
              height={isMobile ? '20px' : '16px'}
              className="animate-pulse"
              style={{ animationDelay: `${index * 100}ms` }}
            />
            
            {/* Field input */}
            <div className="relative">
              <ShimmerSkeleton
                width="100%"
                height={isMobile ? '56px' : '48px'}
                className="animate-pulse"
                style={{ animationDelay: `${index * 150}ms` }}
              />
              
              {/* Validation icon placeholder */}
              {field.hasValidation && showValidationStates && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <ShimmerSkeleton
                    width={isMobile ? '24px' : '20px'}
                    height={isMobile ? '24px' : '20px'}
                    className="rounded-full animate-pulse"
                    style={{ animationDelay: `${index * 200}ms` }}
                  />
                </div>
              )}
            </div>
            
            {/* Validation message placeholder */}
            {field.hasValidation && showValidationStates && (
              <ShimmerSkeleton
                width="60%"
                height="12px"
                className="animate-pulse"
                style={{ animationDelay: `${index * 250}ms` }}
              />
            )}
          </div>
        ))}

        {/* Submit button skeleton */}
        <ShimmerSkeleton
          width="100%"
          height={isMobile ? '56px' : '48px'}
          className={`${isMobile ? 'mt-8' : 'mt-6'} animate-pulse`}
          style={{ animationDelay: `${fields.length * 150}ms` }}
        />

        {/* Additional links skeleton */}
        <div className="text-center space-y-2 mt-4">
          <ShimmerSkeleton
            width={isMobile ? '128px' : '112px'}
            height={isMobile ? '20px' : '16px'}
            className="mx-auto animate-pulse"
            style={{ animationDelay: `${(fields.length + 1) * 150}ms` }}
          />
          {formType !== 'admin' && (
            <ShimmerSkeleton
              width={isMobile ? '160px' : '144px'}
              height={isMobile ? '20px' : '16px'}
              className="mx-auto animate-pulse"
              style={{ animationDelay: `${(fields.length + 2) * 150}ms` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Progressive loading skeleton that reveals content gradually
 */
export function ProgressiveFormSkeleton({
  loadingStage = 'initial',
  className = '',
}: {
  loadingStage?: 'initial' | 'validating' | 'submitting' | 'complete';
  className?: string;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className={`max-w-md mx-auto transition-all duration-500 ${className}`}>
      {/* Header - always visible */}
      <div className="text-center mb-8">
        <div className={`bg-gray-200 rounded-full mx-auto mb-4 transition-all duration-300 ${
          loadingStage === 'complete' ? 'bg-green-200' : 'animate-pulse'
        } ${isMobile ? 'w-20 h-20' : 'w-16 h-16'}`} />
        
        <div className={`bg-gray-200 rounded mx-auto mb-2 transition-all duration-300 ${
          loadingStage === 'complete' ? 'bg-green-200' : 'animate-pulse'
        } ${isMobile ? 'h-8 w-48' : 'h-6 w-40'}`} />
      </div>

      {/* Form content - progressive reveal */}
      <div className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
        {/* Stage 1: Basic structure */}
        <div className={`transition-opacity duration-500 ${
          loadingStage === 'initial' ? 'opacity-100' : 'opacity-0'
        }`}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 mb-4">
              <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-5 w-24' : 'h-4 w-20'}`} />
              <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'}`} />
            </div>
          ))}
        </div>

        {/* Stage 2: Validation states */}
        <div className={`transition-opacity duration-500 ${
          loadingStage === 'validating' ? 'opacity-100' : 'opacity-0'
        }`}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 mb-4">
              <div className={`bg-blue-200 rounded animate-pulse ${isMobile ? 'h-5 w-24' : 'h-4 w-20'}`} />
              <div className="relative">
                <div className={`bg-blue-200 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'}`} />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className={`bg-blue-400 rounded-full animate-spin ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stage 3: Submitting */}
        <div className={`transition-opacity duration-500 ${
          loadingStage === 'submitting' ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className={`bg-blue-300 rounded animate-pulse ${isMobile ? 'h-14 w-full' : 'h-12 w-full'}`} />
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stage 4: Complete */}
        <div className={`transition-opacity duration-500 ${
          loadingStage === 'complete' ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="text-center space-y-4 text-green-600">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
              เสร็จสิ้น
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}