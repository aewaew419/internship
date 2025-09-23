'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatisticsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  primary: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'text-blue-600',
    icon: 'text-blue-500'
  },
  secondary: {
    bg: 'bg-gray-50',
    border: 'border-gray-200', 
    text: 'text-gray-900',
    accent: 'text-gray-600',
    icon: 'text-gray-500'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900', 
    accent: 'text-green-600',
    icon: 'text-green-500'
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    accent: 'text-orange-600', 
    icon: 'text-orange-500'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    accent: 'text-red-600',
    icon: 'text-red-500'
  }
};

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  className,
  onClick
}) => {
  const colors = colorVariants[color];
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-4 sm:p-6 transition-all duration-200',
        colors.bg,
        colors.border,
        isClickable && 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        'touch-manipulation', // Optimize for touch devices
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={cn(
            'text-sm sm:text-base font-medium leading-tight',
            colors.text
          )}>
            {title}
          </h3>
        </div>
        {icon && (
          <div className={cn('flex-shrink-0 ml-2', colors.icon)}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mb-2">
        <p className={cn(
          'text-2xl sm:text-3xl lg:text-4xl font-bold leading-none',
          colors.text
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>

      {/* Subtitle and trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className={cn(
            'text-xs sm:text-sm',
            colors.accent
          )}>
            {subtitle}
          </p>
        )}
        
        {trend && (
          <div className={cn(
            'flex items-center text-xs sm:text-sm font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <span className="mr-1">
              {trend.isPositive ? '↗' : '↘'}
            </span>
            <span>
              {Math.abs(trend.value)}%
            </span>
            {trend.label && (
              <span className="ml-1 text-gray-500">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsCard;