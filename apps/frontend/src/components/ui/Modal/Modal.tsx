"use client";

import { useEffect, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  mobileFullScreen?: boolean;
  className?: string;
  overlayClassName?: string;
  preventScroll?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  closeOnOverlayClick = true,
  showCloseButton = true,
  mobileFullScreen = false,
  className,
  overlayClassName,
  preventScroll = true,
}: ModalProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and focus management
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTabKey);
      
      if (preventScroll) {
        document.body.style.overflow = "hidden";
      }

      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      if (preventScroll) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isOpen, onClose, preventScroll]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full w-full h-full",
  };

  const isFullScreen = (isMobile && mobileFullScreen) || size === "full";

  const modalContent = (
    <div 
      className={cn(
        "fixed inset-0 z-modal flex items-center justify-center",
        isFullScreen ? "p-0" : "p-4",
        "animate-in fade-in-0 duration-200"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
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
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-white shadow-xl transition-all duration-200",
          isFullScreen 
            ? "h-full rounded-none" 
            : "rounded-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95",
          !isFullScreen && sizeClasses[size],
          // Mobile-specific styles
          isMobile && !isFullScreen && [
            "mx-4 max-w-[calc(100vw-2rem)]",
            "touch-manipulation"
          ],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            "flex items-center justify-between border-b border-gray-200",
            isFullScreen ? "p-4 sticky top-0 bg-white z-10" : "p-6"
          )}>
            {title && (
              <h2 
                id="modal-title"
                className={cn(
                  "font-semibold text-gray-900 pr-4",
                  isFullScreen ? "text-xl" : "text-lg"
                )}
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors",
                  "touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500",
                  isMobile && "p-3" // Larger touch target on mobile
                )}
                aria-label="Close modal"
              >
                <svg
                  className={cn("text-gray-400", isMobile ? "w-6 h-6" : "w-5 h-5")}
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
        <div className={cn(
          isFullScreen ? "p-4 pb-safe" : "p-6",
          (title || showCloseButton) && !isFullScreen && "pt-4",
          isFullScreen && "flex-1 overflow-y-auto"
        )}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};