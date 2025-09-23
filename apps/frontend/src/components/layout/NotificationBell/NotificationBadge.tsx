'use client';

import React, { useEffect, useState } from 'react';

interface NotificationBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  maxCount?: number;
  className?: string;
  variant?: 'default' | 'dot' | 'minimal';
}

export function NotificationBadge({
  count,
  size = 'md',
  animate = true,
  maxCount = 99,
  className = '',
  variant = 'default',
}: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  // Size configurations
  const sizeConfig = {
    sm: {
      badge: 'h-4 w-4 text-xs',
      dot: 'h-2 w-2',
      minimal: 'h-3 w-3 text-xs',
    },
    md: {
      badge: 'h-5 w-5 text-xs',
      dot: 'h-2.5 w-2.5',
      minimal: 'h-4 w-4 text-xs',
    },
    lg: {
      badge: 'h-6 w-6 text-sm',
      dot: 'h-3 w-3',
      minimal: 'h-5 w-5 text-sm',
    },
  };

  const config = sizeConfig[size];

  // Format count display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Animate on count change
  useEffect(() => {
    if (animate && count !== prevCount && count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount, animate]);

  // Don't render if count is 0
  if (count <= 0) return null;

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center
    bg-red-500 text-white font-medium rounded-full
    transition-all duration-200
    ${isAnimating ? 'animate-bounce scale-110' : 'scale-100'}
    ${className}
  `;

  // Render based on variant
  switch (variant) {
    case 'dot':
      return (
        <span
          className={`
            ${baseClasses}
            ${config.dot}
          `}
          aria-label={`${count} unread notifications`}
        />
      );

    case 'minimal':
      return (
        <span
          className={`
            ${baseClasses}
            ${config.minimal}
            ${count > 9 ? 'px-1' : ''}
          `}
          aria-label={`${count} unread notifications`}
        >
          {count > 9 ? '9+' : count}
        </span>
      );

    default:
      return (
        <span
          className={`
            ${baseClasses}
            ${config.badge}
            ${displayCount.length > 1 ? 'px-1' : ''}
          `}
          aria-label={`${count} unread notifications`}
        >
          {displayCount}
        </span>
      );
  }
}

// Animated badge with custom animations
export function AnimatedNotificationBadge({
  count,
  size = 'md',
  className = '',
  ...props
}: NotificationBadgeProps) {
  const [showBadge, setShowBadge] = useState(count > 0);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (count > 0 && !showBadge) {
      // Badge appearing
      setShowBadge(true);
      setAnimationClass('animate-scale-in');
      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
    } else if (count === 0 && showBadge) {
      // Badge disappearing
      setAnimationClass('animate-scale-out');
      const timer = setTimeout(() => {
        setShowBadge(false);
        setAnimationClass('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [count, showBadge]);

  if (!showBadge) return null;

  return (
    <NotificationBadge
      count={count}
      size={size}
      animate={true}
      className={`${animationClass} ${className}`}
      {...props}
    />
  );
}

// Pulsing badge for high priority notifications
export function PulsingNotificationBadge({
  count,
  size = 'md',
  className = '',
  ...props
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <div className="relative">
      <NotificationBadge
        count={count}
        size={size}
        className={`animate-pulse ${className}`}
        {...props}
      />
      
      {/* Pulse ring effect */}
      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
    </div>
  );
}

// Custom CSS animations
const badgeAnimations = `
  @keyframes scale-in {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes scale-out {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
  }
  
  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }
  
  .animate-scale-out {
    animation: scale-out 0.3s ease-in;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('notification-badge-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-badge-styles';
  style.textContent = badgeAnimations;
  document.head.appendChild(style);
}