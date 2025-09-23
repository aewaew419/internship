'use client';

import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { ReactNode, useEffect, useRef, useState } from "react";

interface ResponsiveChartProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  enableFullscreen?: boolean;
}

export function ResponsiveChart({
  children,
  className = "",
  minHeight = 200,
  maxHeight = 500,
  aspectRatio = 1, // 1:1 for donut charts
  enableFullscreen = false,
}: ResponsiveChartProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (isMobile) {
      return {
        width: '100%',
        maxWidth: '280px',
        height: Math.min(Math.max(minHeight, 200), 280),
        padding: '1rem',
      };
    } else if (isTablet) {
      return {
        width: '100%',
        maxWidth: '350px',
        height: Math.min(Math.max(minHeight, 250), 350),
        padding: '1.5rem',
      };
    } else {
      return {
        width: '100%',
        maxWidth: '400px',
        height: Math.min(Math.max(minHeight, 300), maxHeight),
        padding: '2rem',
      };
    }
  };

  const dimensions = getResponsiveDimensions();

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!enableFullscreen || !containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`
        relative mx-auto transition-all duration-300 ease-in-out
        ${isFullscreen ? 'w-screen h-screen bg-white z-50' : ''}
        ${className}
      `}
      style={{
        width: isFullscreen ? '100vw' : dimensions.width,
        maxWidth: isFullscreen ? 'none' : dimensions.maxWidth,
        height: isFullscreen ? '100vh' : dimensions.height,
        padding: isFullscreen ? '2rem' : dimensions.padding,
      }}
    >
      {/* Fullscreen toggle button for mobile */}
      {enableFullscreen && isMobile && (
        <button
          onClick={toggleFullscreen}
          className="
            absolute top-2 right-2 z-10 p-2 rounded-full
            bg-gray-100 hover:bg-gray-200 transition-colors
            touch-manipulation
          "
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      )}

      {/* Chart container with responsive sizing */}
      <div
        className="
          w-full h-full flex items-center justify-center
          relative overflow-hidden
        "
        style={{
          aspectRatio: isFullscreen ? 'auto' : aspectRatio,
        }}
      >
        {children}
      </div>

      {/* Mobile-specific touch indicators */}
      {isMobile && !isFullscreen && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}