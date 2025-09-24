"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface DesktopTooltipProps {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const DesktopTooltip = ({
  content,
  position = "top",
  delay = 500,
  children,
  disabled = false,
  className,
}: DesktopTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Don't render tooltip on mobile/tablet
  if (!isDesktop || disabled) {
    return <>{children}</>;
  }

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      adjustPosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const adjustPosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let newPosition = position;

    // Check if tooltip fits in the preferred position
    switch (position) {
      case "top":
        if (triggerRect.top - tooltipRect.height < 10) {
          newPosition = "bottom";
        }
        break;
      case "bottom":
        if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
          newPosition = "top";
        }
        break;
      case "left":
        if (triggerRect.left - tooltipRect.width < 10) {
          newPosition = "right";
        }
        break;
      case "right":
        if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
          newPosition = "left";
        }
        break;
    }

    setActualPosition(newPosition);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = [
      "absolute z-50 px-3 py-2 text-sm text-white",
      "bg-gray-900 rounded-lg shadow-lg",
      "pointer-events-none whitespace-nowrap",
      "transition-all duration-200",
      isVisible ? "opacity-100 visible" : "opacity-0 invisible",
    ];

    const positionClasses = {
      top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
      left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
      right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    };

    return cn(baseClasses, positionClasses[actualPosition], className);
  };

  const getArrowClasses = () => {
    const baseClasses = ["absolute"];

    const arrowClasses = {
      top: "top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900",
      bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900",
      left: "left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900",
      right: "right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900",
    };

    return cn(baseClasses, arrowClasses[actualPosition]);
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <div ref={tooltipRef} className={getTooltipClasses()}>
        {content}
        <div className={getArrowClasses()}></div>
      </div>
    </div>
  );
};