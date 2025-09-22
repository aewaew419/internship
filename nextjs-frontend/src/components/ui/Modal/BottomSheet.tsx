"use client";

import { useEffect, ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[]; // Percentage heights: [25, 50, 90]
  defaultSnapPoint?: number;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  showDragHandle?: boolean;
  className?: string;
  overlayClassName?: string;
  onSnapPointChange?: (snapPoint: number) => void;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
  defaultSnapPoint,
  closeOnOverlayClick = true,
  showCloseButton = true,
  showDragHandle = true,
  className,
  overlayClassName,
  onSnapPointChange,
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(
    defaultSnapPoint ?? snapPoints[snapPoints.length - 1]
  );
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle drag gestures
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setStartHeight(currentSnapPoint);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging || !sheetRef.current) return;

    const deltaY = startY - clientY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;
    const newHeight = Math.max(0, Math.min(100, startHeight + deltaPercentage));
    
    setCurrentSnapPoint(newHeight);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Find closest snap point
    const closest = snapPoints.reduce((prev, curr) => 
      Math.abs(curr - currentSnapPoint) < Math.abs(prev - currentSnapPoint) ? curr : prev
    );
    
    // If dragged below minimum snap point, close
    if (currentSnapPoint < Math.min(...snapPoints) - 10) {
      onClose();
      return;
    }
    
    setCurrentSnapPoint(closest);
    onSnapPointChange?.(closest);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startY, startHeight]);

  if (!isOpen) return null;

  const sheetContent = (
    <div 
      className="fixed inset-0 z-modal animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "bottomsheet-title" : undefined}
    >
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm",
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl",
          "flex flex-col transition-all duration-200 ease-out",
          "animate-in slide-in-from-bottom",
          className
        )}
        style={{ 
          height: `${currentSnapPoint}vh`,
          maxHeight: '100vh'
        }}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div 
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-manipulation"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
            {title && (
              <h2 
                id="bottomsheet-title"
                className="text-lg font-semibold text-gray-900 pr-4"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close bottom sheet"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-safe">
          {children}
        </div>
        
        {/* Snap Point Indicators */}
        {snapPoints.length > 1 && (
          <div className="flex justify-center space-x-2 py-2 bg-gray-50">
            {snapPoints.map((point) => (
              <button
                key={point}
                onClick={() => {
                  setCurrentSnapPoint(point);
                  onSnapPointChange?.(point);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentSnapPoint === point ? "bg-primary-600" : "bg-gray-300"
                )}
                aria-label={`Snap to ${point}% height`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
};