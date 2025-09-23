'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationBadge } from './NotificationBadge';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  animate?: boolean;
  mobileOptimized?: boolean;
  className?: string;
  showDropdown?: boolean;
  dropdownPosition?: 'left' | 'right' | 'center';
  maxDropdownItems?: number;
}

export function NotificationBell({
  unreadCount: propUnreadCount,
  onClick,
  size = 'md',
  showBadge = true,
  animate = true,
  mobileOptimized = true,
  className = '',
  showDropdown = true,
  dropdownPosition = 'right',
  maxDropdownItems = 5,
}: NotificationBellProps) {
  const { unreadCount: contextUnreadCount, notifications } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use prop unreadCount if provided, otherwise use context
  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : contextUnreadCount;

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'h-4 w-4',
      button: 'p-1',
      badge: 'text-xs',
    },
    md: {
      icon: 'h-5 w-5',
      button: 'p-2',
      badge: 'text-xs',
    },
    lg: {
      icon: 'h-6 w-6',
      button: 'p-2',
      badge: 'text-sm',
    },
  };

  const config = sizeConfig[size];

  // Handle bell click
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onClick) {
      onClick();
    } else if (showDropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    }

    // Trigger animation
    if (animate && unreadCount > 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [onClick, showDropdown, isDropdownOpen, animate, unreadCount]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleClick(event as any);
        break;
      case 'Escape':
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
        break;
    }
  }, [handleClick, isDropdownOpen]);

  // Auto-animate on new notifications
  useEffect(() => {
    if (animate && unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [animate, unreadCount]);

  // Mobile touch optimization
  const touchProps = mobileOptimized ? {
    style: { minHeight: '44px', minWidth: '44px' },
  } : {};

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex items-center justify-center rounded-full
          text-gray-600 hover:text-gray-900 hover:bg-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all duration-200
          ${config.button}
          ${isAnimating ? 'animate-pulse' : ''}
          ${className}
        `}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup={showDropdown ? 'true' : 'false'}
        {...touchProps}
      >
        {/* Bell Icon */}
        {unreadCount > 0 && animate ? (
          <BellRing 
            className={`
              ${config.icon} 
              ${isAnimating ? 'animate-bounce' : ''}
              transition-transform duration-200
            `} 
          />
        ) : (
          <Bell 
            className={`
              ${config.icon}
              ${isAnimating ? 'animate-shake' : ''}
              transition-transform duration-200
            `} 
          />
        )}

        {/* Notification Badge */}
        {showBadge && unreadCount > 0 && (
          <NotificationBadge
            count={unreadCount}
            size={size}
            animate={animate}
            className="absolute -top-1 -right-1"
          />
        )}

        {/* Pulse indicator for new notifications */}
        {unreadCount > 0 && animate && (
          <span className="absolute -top-1 -right-1 h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && isDropdownOpen && (
        <NotificationDropdown
          ref={dropdownRef}
          notifications={notifications.slice(0, maxDropdownItems)}
          position={dropdownPosition}
          onClose={() => setIsDropdownOpen(false)}
          className="absolute z-50 mt-2"
        />
      )}
    </div>
  );
}

// Custom shake animation for CSS
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
    20%, 40%, 60%, 80% { transform: rotate(10deg); }
  }
  
  .animate-shake {
    animation: shake 0.6s ease-in-out;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('notification-bell-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-bell-styles';
  style.textContent = shakeKeyframes;
  document.head.appendChild(style);
}