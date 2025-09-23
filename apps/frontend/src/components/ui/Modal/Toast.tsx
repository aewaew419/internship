"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast = ({
  id,
  title,
  message,
  type = "info",
  duration = 5000,
  position = "top-right",
  onClose,
  action,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto close
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 200);
  };

  const typeStyles = {
    success: {
      bg: "bg-green-50 border-green-200",
      icon: "text-green-600",
      title: "text-green-800",
      message: "text-green-700",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: "text-red-600",
      title: "text-red-800",
      message: "text-red-700",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-600",
      title: "text-yellow-800",
      message: "text-yellow-700",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-800",
      message: "text-blue-700",
    },
  };

  const positionStyles = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  const animationClasses = {
    "top-right": isExiting ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right",
    "top-left": isExiting ? "animate-out slide-out-to-left" : "animate-in slide-in-from-left",
    "bottom-right": isExiting ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right",
    "bottom-left": isExiting ? "animate-out slide-out-to-left" : "animate-in slide-in-from-left",
    "top-center": isExiting ? "animate-out slide-out-to-top" : "animate-in slide-in-from-top",
    "bottom-center": isExiting ? "animate-out slide-out-to-bottom" : "animate-in slide-in-from-bottom",
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const toastContent = (
    <div
      className={cn(
        "fixed z-[100] max-w-sm w-full pointer-events-auto",
        "bg-white rounded-lg border shadow-lg",
        "transform transition-all duration-200 ease-out",
        positionStyles[position],
        animationClasses[position],
        typeStyles[type].bg,
        // Mobile responsive
        "mx-4 sm:mx-0 sm:max-w-sm"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={cn("flex-shrink-0", typeStyles[type].icon)}>
            {getIcon()}
          </div>
          
          <div className="ml-3 flex-1 min-w-0">
            {title && (
              <p className={cn("text-sm font-medium", typeStyles[type].title)}>
                {title}
              </p>
            )}
            <p className={cn(
              "text-sm",
              typeStyles[type].message,
              title && "mt-1"
            )}>
              {message}
            </p>
            
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className={cn(
                    "text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded",
                    typeStyles[type].title
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={cn(
                "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                "hover:bg-gray-100 transition-colors touch-manipulation",
                typeStyles[type].icon
              )}
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for auto-close */}
      {duration > 0 && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all ease-linear",
              type === "success" && "bg-green-500",
              type === "error" && "bg-red-500",
              type === "warning" && "bg-yellow-500",
              type === "info" && "bg-blue-500"
            )}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );

  return createPortal(toastContent, document.body);
};