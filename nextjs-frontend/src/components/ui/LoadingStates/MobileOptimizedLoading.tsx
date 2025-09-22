'use client';

interface MobileOptimizedLoadingProps {
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

/**
 * Mobile-optimized loading component with different variants
 * Designed to provide clear feedback on mobile devices
 */
export function MobileOptimizedLoading({
  variant = 'spinner',
  size = 'md',
  message,
  fullScreen = false,
}: MobileOptimizedLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  const renderSpinner = () => (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-blue-600 rounded-full animate-pulse ${
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          }`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`bg-blue-600 rounded-full animate-pulse ${sizeClasses[size]}`} />
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case 'skeleton':
        return renderSkeleton();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-3">
        {renderLoadingContent()}
        {message && (
          <p className="text-sm text-gray-600 text-center max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Specific loading components for common use cases
export function PageLoading({ message = 'กำลังโหลด...' }: { message?: string }) {
  return (
    <MobileOptimizedLoading
      variant="spinner"
      size="lg"
      message={message}
      fullScreen
    />
  );
}

export function CardLoading() {
  return (
    <MobileOptimizedLoading
      variant="skeleton"
      size="md"
    />
  );
}

export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <MobileOptimizedLoading
      variant="spinner"
      size={size}
    />
  );
}

export function InlineLoading({ message }: { message?: string }) {
  return (
    <MobileOptimizedLoading
      variant="dots"
      size="sm"
      message={message}
    />
  );
}