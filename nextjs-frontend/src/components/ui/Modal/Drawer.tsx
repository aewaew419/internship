"use client";

import { useEffect, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "full";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

export const Drawer = ({
  isOpen,
  onClose,
  children,
  title,
  position = "right",
  size = "md",
  closeOnOverlayClick = true,
  showCloseButton = true,
  className,
  overlayClassName,
}: DrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key and focus management
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: {
      left: "w-64",
      right: "w-64", 
      top: "h-1/3",
      bottom: "h-1/3",
    },
    md: {
      left: "w-80",
      right: "w-80",
      top: "h-1/2", 
      bottom: "h-1/2",
    },
    lg: {
      left: "w-96",
      right: "w-96",
      top: "h-2/3",
      bottom: "h-2/3",
    },
    full: {
      left: "w-full",
      right: "w-full",
      top: "h-full",
      bottom: "h-full",
    },
  };

  const positionClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  };

  const animationClasses = {
    left: "animate-in slide-in-from-left duration-300",
    right: "animate-in slide-in-from-right duration-300", 
    top: "animate-in slide-in-from-top duration-300",
    bottom: "animate-in slide-in-from-bottom duration-300",
  };

  const drawerContent = (
    <div 
      className="fixed inset-0 z-modal animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drawer-title" : undefined}
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
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed bg-white shadow-xl flex flex-col",
          positionClasses[position],
          sizeClasses[size][position],
          animationClasses[position],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            {title && (
              <h2 
                id="drawer-title"
                className="text-lg font-semibold text-gray-900 pr-4"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close drawer"
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
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};