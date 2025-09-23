'use client';

import React from 'react';
import { useProgressiveEnhancement } from './ProgressiveNotificationProvider';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAlternative?: boolean;
  alternativeText?: string;
}

/**
 * Component that conditionally renders content based on feature availability
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showAlternative = true,
  alternativeText
}: FeatureGateProps) {
  const { canUseFeature, getFeatureAlternative, isLoading } = useProgressiveEnhancement();

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Check if feature is available
  const isFeatureAvailable = canUseFeature(feature);

  if (isFeatureAvailable) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show alternative information
  if (showAlternative) {
    const alternative = getFeatureAlternative(feature);
    const displayText = alternativeText || alternative;

    if (displayText) {
      return (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-500 mt-0.5">⚡</span>
            <div>
              <p className="font-medium text-gray-800 mb-1">
                Feature not available
              </p>
              <p>{displayText}</p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Don't render anything if no fallback or alternative
  return null;
}

interface ConditionalFeatureProps {
  when: string | string[];
  children: React.ReactNode;
  otherwise?: React.ReactNode;
}

/**
 * Component that renders content when specific features are available
 */
export function ConditionalFeature({ when, children, otherwise }: ConditionalFeatureProps) {
  const { canUseFeature } = useProgressiveEnhancement();

  const features = Array.isArray(when) ? when : [when];
  const allFeaturesAvailable = features.every(feature => canUseFeature(feature));

  if (allFeaturesAvailable) {
    return <>{children}</>;
  }

  return otherwise ? <>{otherwise}</> : null;
}

interface ProgressiveFeatureProps {
  baseline: React.ReactNode;
  enhanced?: React.ReactNode;
  premium?: React.ReactNode;
}

/**
 * Component that renders different content based on enhancement level
 */
export function ProgressiveFeature({ baseline, enhanced, premium }: ProgressiveFeatureProps) {
  const { enhancementLevel } = useProgressiveEnhancement();

  switch (enhancementLevel) {
    case 'premium':
      return <>{premium || enhanced || baseline}</>;
    case 'enhanced':
      return <>{enhanced || baseline}</>;
    case 'baseline':
    default:
      return <>{baseline}</>;
  }
}

interface FeatureStatusProps {
  feature: string;
  className?: string;
}

/**
 * Component that shows the status of a specific feature
 */
export function FeatureStatus({ feature, className = '' }: FeatureStatusProps) {
  const { canUseFeature, getFeatureAlternative } = useProgressiveEnhancement();

  const isAvailable = canUseFeature(feature);
  const alternative = getFeatureAlternative(feature);

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span className="font-medium capitalize">
        {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
      </span>
      <span className={isAvailable ? 'text-green-600' : 'text-red-600'}>
        {isAvailable ? 'Available' : 'Not Available'}
      </span>
      {!isAvailable && alternative && (
        <span className="text-gray-500 text-xs">
          ({alternative})
        </span>
      )}
    </div>
  );
}

interface FeatureListProps {
  features: string[];
  showStatus?: boolean;
  className?: string;
}

/**
 * Component that shows a list of features and their availability
 */
export function FeatureList({ features, showStatus = true, className = '' }: FeatureListProps) {
  const { availableFeatures, unavailableFeatures } = useProgressiveEnhancement();

  return (
    <div className={`space-y-2 ${className}`}>
      {features.map(feature => {
        const isAvailable = availableFeatures.includes(feature);
        
        return (
          <div key={feature} className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize">
              {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
            {showStatus && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isAvailable ? 'Available' : 'Not Available'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface EnhancementLevelBadgeProps {
  className?: string;
}

/**
 * Component that shows the current enhancement level
 */
export function EnhancementLevelBadge({ className = '' }: EnhancementLevelBadgeProps) {
  const { enhancementLevel, availableFeatures } = useProgressiveEnhancement();

  const getBadgeStyle = () => {
    switch (enhancementLevel) {
      case 'premium':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'enhanced':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'baseline':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (enhancementLevel) {
      case 'premium':
        return '🚀';
      case 'enhanced':
        return '⚡';
      case 'baseline':
      default:
        return '📱';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getBadgeStyle()} ${className}`}>
      <span role="img" aria-label={enhancementLevel}>
        {getIcon()}
      </span>
      <span className="capitalize">{enhancementLevel}</span>
      <span className="text-xs opacity-75">
        ({availableFeatures.length} features)
      </span>
    </div>
  );
}