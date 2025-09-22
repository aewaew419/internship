"use client";

import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  className?: string;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  className = "",
}: PullToRefreshProps) => {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled,
  });

  const refreshIconRotation = Math.min((pullDistance / threshold) * 360, 360);
  const refreshOpacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, threshold)}px)` : undefined,
        transition: isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Pull to refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white/90 backdrop-blur-sm border-b border-gray-200"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`,
            transform: `translateY(-${Math.min(pullDistance, threshold)}px)`,
            opacity: refreshOpacity,
          }}
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              style={{
                transform: isRefreshing ? undefined : `rotate(${refreshIconRotation}deg)`,
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>
              {isRefreshing
                ? "กำลังรีเฟรช..."
                : canRefresh
                ? "ปล่อยเพื่อรีเฟรช"
                : "ดึงลงเพื่อรีเฟรช"}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
};