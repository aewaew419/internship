"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface DesktopFormContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "elevated" | "sidebar";
  size?: "sm" | "md" | "lg" | "xl";
  centerContent?: boolean;
  enableHoverEffects?: boolean;
  showShadow?: boolean;
}

const DesktopFormContainer = forwardRef<HTMLDivElement, DesktopFormContainerProps>(
  ({ 
    className, 
    children,
    variant = "card",
    size = "lg",
    centerContent = true,
    enableHoverEffects = true,
    showShadow = true,
    ...props 
  }, ref) => {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

    // Base container classes
    const baseClasses = [
      "w-full",
      centerContent && "mx-auto",
      "transition-all duration-300",
    ];

    // Enhanced sizing for desktop/tablet
    const sizeClasses = {
      sm: cn(
        "max-w-sm",
        isTablet && "max-w-md px-6 py-8",
        isDesktop && "max-w-lg px-8 py-10"
      ),
      md: cn(
        "max-w-md",
        isTablet && "max-w-lg px-8 py-10", 
        isDesktop && "max-w-xl px-10 py-12"
      ),
      lg: cn(
        "max-w-lg",
        isTablet && "max-w-xl px-8 py-10",
        isDesktop && "max-w-2xl px-12 py-16"
      ),
      xl: cn(
        "max-w-xl",
        isTablet && "max-w-2xl px-10 py-12",
        isDesktop && "max-w-4xl px-16 py-20"
      ),
    };

    // Enhanced variant styles for desktop
    const variants = {
      default: cn(
        "bg-white",
        "py-6 px-4",
        isTablet && "py-8 px-6",
        isDesktop && "py-10 px-8"
      ),
      card: cn(
        "bg-white rounded-xl border border-gray-200",
        "py-6 px-4",
        isTablet && "py-8 px-6 rounded-2xl",
        isDesktop && "py-12 px-10 rounded-2xl",
        showShadow && "shadow-sm",
        showShadow && isTablet && "shadow-md",
        showShadow && isDesktop && "shadow-xl",
        enableHoverEffects && isDesktop && "hover:shadow-2xl hover:scale-[1.02]"
      ),
      elevated: cn(
        "bg-white rounded-2xl border border-gray-100",
        "py-8 px-6",
        isTablet && "py-10 px-8 rounded-3xl",
        isDesktop && "py-16 px-12 rounded-3xl",
        showShadow && "shadow-lg",
        showShadow && isTablet && "shadow-xl",
        showShadow && isDesktop && "shadow-2xl",
        enableHoverEffects && isDesktop && "hover:shadow-3xl hover:scale-[1.01]",
        "backdrop-blur-sm bg-white/95"
      ),
      sidebar: cn(
        "bg-white",
        isDesktop && [
          "grid grid-cols-1 lg:grid-cols-3 gap-8",
          "rounded-2xl border border-gray-200",
          showShadow && "shadow-xl",
          "py-12 px-10"
        ],
        !isDesktop && "py-6 px-4"
      ),
    };

    // Spacing configurations
    const spacingClasses = cn(
      "space-y-4",
      isTablet && "space-y-6",
      isDesktop && "space-y-8"
    );

    const containerClasses = cn(
      baseClasses,
      sizeClasses[size],
      variants[variant],
      className
    );

    // For sidebar variant on desktop, create special layout
    if (variant === "sidebar" && isDesktop) {
      return (
        <div className={containerClasses} ref={ref} {...props}>
          <div className="lg:col-span-1">
            {/* Sidebar content could go here */}
            <div className="sticky top-8">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome Back
                </h2>
                <p className="text-gray-600 mb-6">
                  Please sign in to your account to continue.
                </p>
                <div className="hidden lg:block">
                  <img 
                    src="/auth-illustration.svg" 
                    alt="Authentication" 
                    className="w-full max-w-sm mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className={spacingClasses}>
              {children}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={containerClasses} ref={ref} {...props}>
        <div className={spacingClasses}>
          {children}
        </div>
      </div>
    );
  }
);

DesktopFormContainer.displayName = "DesktopFormContainer";

export { DesktopFormContainer };