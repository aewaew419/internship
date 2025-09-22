'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { useEffect, useRef, useState } from "react";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface DonutChartProps {
  data?: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
  className?: string;
  enableTouch?: boolean;
}

const defaultData = {
  labels: ["เอกสารผ่านแล้ว", "รอการพิจารณา", "กำลังเลือกบริษัท"],
  datasets: [
    {
      data: [60, 20, 20],
      backgroundColor: ["#344BFD", "#F4A79D", "#F68D2B"],
      datalabels: {
        anchor: "end" as const,
      },
    },
  ],
};

// Create responsive options based on screen size
const createResponsiveOptions = (isMobile: boolean, isTablet: boolean, enableTouch: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  cutoutPercentage: 32,
  layout: {
    padding: {
      top: isMobile ? 10 : isTablet ? 15 : 20,
      bottom: isMobile ? 10 : isTablet ? 15 : 20,
      left: isMobile ? 10 : isTablet ? 15 : 20,
      right: isMobile ? 10 : isTablet ? 15 : 20,
    },
  },
  elements: {
    line: {
      fill: false,
    },
    point: {
      hoverRadius: isMobile ? 10 : 7,
      radius: isMobile ? 8 : 5,
    },
    arc: {
      // Increase touch target size on mobile
      borderWidth: isMobile ? 3 : 2,
      hoverBorderWidth: isMobile ? 5 : 3,
    },
  },
  interaction: {
    // Enhanced touch interactions for mobile
    intersect: false,
    mode: 'nearest' as const,
  },
  onHover: enableTouch && isMobile ? (event: any, elements: any) => {
    // Add haptic feedback for mobile if available
    if (elements.length > 0 && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } : undefined,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      // Enhanced tooltips for mobile
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#fff',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: isMobile ? 12 : 8,
      titleFont: {
        size: isMobile ? 14 : 12,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: isMobile ? 13 : 11,
      },
      // Position tooltip better on mobile
      position: isMobile ? 'nearest' as const : 'average' as const,
    },
    datalabels: {
      backgroundColor: "#ECEAF8",
      borderRadius: 50,
      color: "black",
      display: (context: any) => {
        var dataset = context.dataset;
        var count = dataset.data.length;
        var value = dataset.data[context.dataIndex];
        // Show labels more liberally on larger screens
        return isMobile ? value > count * 2 : value > count * 1.5;
      },
      font: {
        weight: "bold" as const,
        size: isMobile ? 10 : isTablet ? 11 : 12,
      },
      padding: isMobile ? 6 : 8,
      formatter: (value: number) => `${Math.round(value)}%`,
    },
  },
});

export function DonutChart({ 
  data = defaultData, 
  className = "", 
  enableTouch = true 
}: DonutChartProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const chartRef = useRef<any>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Create responsive options
  const options = createResponsiveOptions(isMobile, isTablet, enableTouch);

  // Handle touch interactions
  useEffect(() => {
    if (!enableTouch || !isMobile || !chartRef.current) return;

    const canvas = chartRef.current.canvas;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      setIsInteracting(true);
      // Prevent scrolling when interacting with chart
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      setIsInteracting(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isInteracting) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enableTouch, isMobile, isInteracting]);

  return (
    <div 
      className={`w-full h-full ${className} ${
        isMobile ? 'touch-manipulation' : ''
      }`}
      style={{
        // Ensure proper touch handling on mobile
        touchAction: enableTouch && isMobile ? 'none' : 'auto',
      }}
    >
      <Doughnut 
        ref={chartRef}
        data={data} 
        options={options}
      />
    </div>
  );
}