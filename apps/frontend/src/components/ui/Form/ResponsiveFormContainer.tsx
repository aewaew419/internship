"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getResponsiveFormClasses, FORM_LAYOUTS } from "@/lib/responsive-utils";

export interface ResponsiveFormContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "modal";
  size?: "sm" | "md" | "lg";
  centerContent?: boolean;
  mobileOptimized?: boolean;
}

const ResponsiveFormContainer = forwardRef<HTMLDivElement, ResponsiveFormContainerProps>(
  ({ 
    className, 
    children,
    variant = "default",
    size = "md",
    centerContent = true,
    mobileOptimized = true,
    ...props 
  }, ref) => {
    const isMobileQuery = useMediaQuery("(max-width: 768px)");
    const isTabletQuery = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
    const isDesktopQuery = useMediaQuery("(min-width: 1024px)");

    // Base container classes
    const baseClasses = [
      "w-full",
      centerContent && "mx-auto",
    ];

    // Responsive sizing
    const sizeClasses = {
      sm: cn(
        "max-w-xs sm:max-w-sm",
        isMobileQuery && "max-w-full px-4",
        isTabletQuery && "max-w-sm px-6",
        isDesktopQuery && "max-w-md px-8"
      ),
      md: cn(
        "max-w-sm sm:max-w-md lg:max-w-lg",
        isMobileQuery && "max-w-full px-4",
        isTabletQuery && "max-w-md px-6", 
        isDesktopQuery && "max-w-lg px-8"
      ),
      lg: cn(
        "max-w-md sm:max-w-lg lg:max-w-xl",
        isMobileQuery && "max-w-full px-4",
        isTabletQuery && "max-w-lg px-6",
        isDesktopQuery && "max-w-xl px-8"
      ),
    };

    // Variant styles
    const variants = {
      default: cn(
        // Mobile-first padding
        "py-6 sm:py-8 lg:py-10",
        isMobileQuery && "py-4",
        isTabletQuery && "py-6",
        isDesktopQuery && "py-8"
      ),
      card: cn(
        "bg-white rounded-xl shadow-sm border border-gray-200",
        "py-6 sm:py-8 lg:py-10",
        "px-4 sm:px-6 lg:px-8",
        // Enhanced mobile card styling
        isMobileQuery && [
          "mx-4 my-4",
          "rounded-lg",
          "shadow-mobile",
          "py-6 px-4"
        ],
        isTabletQuery && [
          "mx-6 my-6", 
          "shadow-md",
          "py-8 px-6"
        ],
        isDesktopQuery && [
          "mx-auto my-8",
          "shadow-lg",
          "py-10 px-8"
        ]
      ),
      modal: cn(
        "bg-white rounded-xl shadow-xl",
        "py-6 sm:py-8",
        "px-4 sm:px-6",
        // Modal-specific mobile optimizations
        isMobileQuery && [
          "w-full max-w-full",
          "rounded-t-xl rounded-b-none", // Bottom sheet style on mobile
          "py-6 px-4"
        ],
        isTabletQuery && [
          "max-w-md",
          "rounded-xl",
          "py-8 px-6"
        ],
        isDesktopQuery && [
          "max-w-lg",
          "rounded-xl", 
          "py-8 px-8"
        ]
      ),
    };

    // Mobile-specific optimizations
    const mobileOptimizations = mobileOptimized ? [
      // Safe area handling for mobile devices
      isMobileQuery && [
        "pb-safe", // Add safe area padding at bottom
        "min-h-0", // Prevent height issues on mobile
      ],
      // Touch-friendly spacing
      "space-y-4 sm:space-y-5 lg:space-y-6",
    ] : [];

    const containerClasses = cn(
      baseClasses,
      sizeClasses[size],
      variants[variant],
      mobileOptimizations,
      className
    );

    return (
      <div
        className={containerClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveFormContainer.displayName = "ResponsiveFormContainer";

export { ResponsiveFormContainer };