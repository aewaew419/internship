'use client';

import { useState, useRef, ReactNode, TouchEvent } from 'react';

interface TouchFeedbackProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onTap?: () => void;
  feedbackColor?: string;
  feedbackOpacity?: number;
}

export const TouchFeedback = ({
  children,
  className = '',
  disabled = false,
  onTap,
  feedbackColor = 'rgba(0, 0, 0, 0.1)',
  feedbackOpacity = 0.3
}: TouchFeedbackProps) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleId = useRef(0);

  const createRipple = (e: TouchEvent) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    const newRipple = {
      id: rippleId.current++,
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    // Call onTap if provided
    if (onTap) {
      onTap();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={createRipple}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            backgroundColor: feedbackColor,
            opacity: feedbackOpacity,
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: ${feedbackOpacity};
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};