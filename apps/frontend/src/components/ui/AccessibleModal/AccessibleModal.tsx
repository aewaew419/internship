"use client";

import { forwardRef, HTMLAttributes, useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { 
  useFocusTrap, 
  useScreenReader, 
  useHighContrast, 
  useReducedMotion, 
  useKeyboardNavigation 
} from "@/hooks/useAccessibility";
import { KEYBOARD_KEYS, SCREEN_READER_MESSAGES } from "@/lib/accessibility";

export interface AccessibleModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "dialog" | "sheet";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  // Accessibility specific props
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  role?: "dialog" | "alertdialog";
  initialFocus?: React.RefObject<HTMLElement>;
  finalFocus?: React.RefObject<HTMLElement>;
}

const AccessibleModal = forwardRef<HTMLDivElement, AccessibleModalProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    size = "md",
    variant = "default",
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    children,
    className,
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    role = "dialog",
    initialFocus,
    finalFocus,
    ...props
  }, ref) => {
    const isMobileQuery = useMediaQuery("(max-width: 768px)");
    const isTabletQuery = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
    
    // Accessibility hooks
    const modalRef = useFocusTrap(isOpen);
    const { announce } = useScreenReader();
    const isHighContrast = useHighContrast();
    const prefersReducedMotion = useReducedMotion();
    
    // Store the element that was focused before the modal opened
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    // Keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation(
      undefined, // onEnter
      closeOnEscape ? onClose : undefined // onEscape
    );

    // Handle modal open/close effects
    useEffect(() => {
      if (isOpen) {
        // Store the previously focused element
        previousActiveElementRef.current = document.activeElement as HTMLElement;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Announce modal opening
        announce(SCREEN_READER_MESSAGES.MODAL.OPENED, 'assertive');
        
        // Focus initial element or first focusable element
        setTimeout(() => {
          if (initialFocus?.current) {
            initialFocus.current.focus();
          } else if (modalRef.current) {
            const firstFocusable = modalRef.current.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            if (firstFocusable) {
              firstFocusable.focus();
            }
          }
        }, 100);
      } else {
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Announce modal closing
        announce(SCREEN_READER_MESSAGES.MODAL.CLOSED, 'assertive');
        
        // Restore focus to the previously focused element or final focus
        setTimeout(() => {
          if (finalFocus?.current) {
            finalFocus.current.focus();
          } else if (previousActiveElementRef.current) {
            previousActiveElementRef.current.focus();
          }
        }, 100);
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen, announce, initialFocus, finalFocus, modalRef]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    // Handle keyboard events
    const handleModalKeyDown = (e: React.KeyboardEvent) => {
      handleKeyDown(e as any);
      
      // Additional modal-specific keyboard handling
      if (e.key === KEYBOARD_KEYS.TAB) {
        // Focus trap is handled by useFocusTrap hook
        return;
      }
    };

    if (!isOpen) return null;

    // Size configurations
    const sizeClasses = {
      sm: cn(
        "max-w-sm",
        isMobileQuery && "max-w-full mx-4",
        isTabletQuery && "max-w-md mx-6"
      ),
      md: cn(
        "max-w-md",
        isMobileQuery && "max-w-full mx-4",
        isTabletQuery && "max-w-lg mx-6"
      ),
      lg: cn(
        "max-w-lg",
        isMobileQuery && "max-w-full mx-4",
        isTabletQuery && "max-w-xl mx-6"
      ),
      xl: cn(
        "max-w-xl",
        isMobileQuery && "max-w-full mx-4",
        isTabletQuery && "max-w-2xl mx-6"
      ),
      full: cn(
        "max-w-full",
        isMobileQuery && "w-full h-full",
        isTabletQuery && "max-w-4xl mx-6"
      ),
    };

    // Variant configurations
    const variantClasses = {
      default: cn(
        "bg-white rounded-xl shadow-xl",
        "max-h-[90vh] overflow-y-auto",
        isMobileQuery && [
          "rounded-t-xl rounded-b-none",
          "fixed bottom-0 left-0 right-0",
          "max-h-[85vh]"
        ],
        isHighContrast && [
          "border-4 border-black",
          "shadow-2xl"
        ]
      ),
      dialog: cn(
        "bg-white rounded-lg shadow-2xl",
        "max-h-[80vh] overflow-y-auto",
        isMobileQuery && [
          "rounded-lg",
          "mx-4 my-8",
          "max-h-[75vh]"
        ],
        isHighContrast && [
          "border-4 border-black",
          "shadow-2xl"
        ]
      ),
      sheet: cn(
        "bg-white shadow-xl",
        "h-full overflow-y-auto",
        isMobileQuery ? [
          "fixed inset-0",
          "rounded-none"
        ] : [
          "rounded-l-xl",
          "fixed right-0 top-0 bottom-0",
          "max-w-md"
        ],
        isHighContrast && [
          "border-l-4 border-black"
        ]
      ),
    };

    const overlayClasses = cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black bg-opacity-50 backdrop-blur-sm",
      prefersReducedMotion ? "" : "transition-opacity duration-300",
      isHighContrast && "bg-black bg-opacity-75",
      variant === "sheet" && !isMobileQuery && "justify-end items-stretch",
      isMobileQuery && variant === "default" && "items-end"
    );

    const modalClasses = cn(
      "relative w-full",
      prefersReducedMotion ? "" : "transition-all duration-300",
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    const modalContent = (
      <div
        className={overlayClasses}
        onClick={handleOverlayClick}
        onKeyDown={handleModalKeyDown}
        role="presentation"
      >
        <div
          ref={modalRef}
          className={modalClasses}
          role={role}
          aria-modal="true"
          aria-label={ariaLabel || title}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          {...props}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              type="button"
              className={cn(
                "absolute top-4 right-4 z-10",
                "p-2 rounded-lg text-gray-400 hover:text-gray-600",
                "hover:bg-gray-100 focus:bg-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-primary-500",
                "transition-colors",
                prefersReducedMotion ? "transition-none" : "duration-200",
                isHighContrast && [
                  "text-black hover:text-black",
                  "hover:bg-gray-200 focus:bg-gray-200",
                  "border-2 border-gray-400 hover:border-black",
                  "focus:ring-4 focus:ring-blue-300"
                ],
                isMobileQuery && [
                  "top-3 right-3",
                  "p-3 min-w-[44px] min-h-[44px]",
                  "flex items-center justify-center"
                ]
              )}
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
            >
              <svg
                className={cn(
                  "w-5 h-5",
                  isMobileQuery && "w-6 h-6"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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

          {/* Modal header */}
          {(title || description) && (
            <div className={cn(
              "px-6 py-4 border-b border-gray-200",
              isMobileQuery && "px-4 py-3",
              isHighContrast && "border-gray-400"
            )}>
              {title && (
                <h2 
                  className={cn(
                    "text-lg font-semibold text-gray-900 mb-1",
                    isMobileQuery && "text-xl",
                    isHighContrast && "text-black"
                  )}
                  id={ariaLabelledBy || `modal-title-${Date.now()}`}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p 
                  className={cn(
                    "text-sm text-gray-600",
                    isMobileQuery && "text-base",
                    isHighContrast && "text-gray-800"
                  )}
                  id={ariaDescribedBy || `modal-description-${Date.now()}`}
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Modal content */}
          <div className={cn(
            "px-6 py-4",
            isMobileQuery && "px-4 py-3",
            variant === "sheet" && "flex-1"
          )}>
            {children}
          </div>

          {/* Keyboard instruction for screen readers */}
          <div className="sr-only" aria-live="polite">
            {SCREEN_READER_MESSAGES.MODAL.CLOSE_INSTRUCTION}
          </div>
        </div>
      </div>
    );

    // Render modal in portal
    return createPortal(modalContent, document.body);
  }
);

AccessibleModal.displayName = "AccessibleModal";

export { AccessibleModal };