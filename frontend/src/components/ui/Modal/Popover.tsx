"use client";

import { useState, useRef, useEffect, ReactNode, cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface PopoverProps {
  children: ReactNode;
  content: ReactNode;
  trigger?: "click" | "hover" | "focus";
  placement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
  offset?: number;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
}

export const Popover = ({
  children,
  content,
  trigger = "click",
  placement = "bottom",
  offset = 8,
  closeOnClickOutside = true,
  closeOnEscape = true,
  disabled = false,
  className,
  contentClassName,
  arrow = true,
}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate position
  const calculatePosition = () => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case "top-start":
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left;
        break;
      case "top-end":
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.right - contentRect.width;
        break;
      case "bottom":
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case "bottom-start":
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case "bottom-end":
        top = triggerRect.bottom + offset;
        left = triggerRect.right - contentRect.width;
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }

    // Adjust for viewport boundaries
    if (left < 8) left = 8;
    if (left + contentRect.width > viewport.width - 8) {
      left = viewport.width - contentRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + contentRect.height > viewport.height - 8) {
      top = viewport.height - contentRect.height - 8;
    }

    setPosition({ top, left });
  };

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnClickOutside &&
        isOpen &&
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      calculatePosition();
      
      // Recalculate on scroll/resize
      const handleReposition = () => calculatePosition();
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
        window.removeEventListener("scroll", handleReposition, true);
        window.removeEventListener("resize", handleReposition);
      };
    }
  }, [isOpen, closeOnClickOutside, closeOnEscape]);

  // Trigger handlers
  const handleClick = () => {
    if (disabled) return;
    if (trigger === "click") {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    if (trigger === "hover") {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    if (trigger === "hover") {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (disabled) return;
    if (trigger === "focus") {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    if (trigger === "focus") {
      setIsOpen(false);
    }
  };

  // Clone trigger element with event handlers
  const triggerElement = isValidElement(children)
    ? cloneElement(children, {
        ref: triggerRef,
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        className: cn(children.props.className, className),
      } as any)
    : children;

  // Arrow component
  const Arrow = () => {
    if (!arrow) return null;

    const arrowClasses = {
      top: "bottom-[-4px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-white",
      "top-start": "bottom-[-4px] left-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-white",
      "top-end": "bottom-[-4px] right-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-white",
      bottom: "top-[-4px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-white",
      "bottom-start": "top-[-4px] left-4 border-l-4 border-r-4 border-b-4 border-transparent border-b-white",
      "bottom-end": "top-[-4px] right-4 border-l-4 border-r-4 border-b-4 border-transparent border-b-white",
      left: "right-[-4px] top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-white",
      right: "left-[-4px] top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-white",
    };

    return <div className={cn("absolute w-0 h-0", arrowClasses[placement])} />;
  };

  return (
    <>
      {triggerElement}
      {isOpen &&
        createPortal(
          <div
            ref={contentRef}
            className={cn(
              "fixed z-dropdown bg-white rounded-lg shadow-lg border border-gray-200",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              "max-w-xs sm:max-w-sm md:max-w-md", // Responsive max width
              contentClassName
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
            role="tooltip"
            onMouseEnter={trigger === "hover" ? () => setIsOpen(true) : undefined}
            onMouseLeave={trigger === "hover" ? () => setIsOpen(false) : undefined}
          >
            <Arrow />
            <div className="p-3 touch-manipulation">
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};