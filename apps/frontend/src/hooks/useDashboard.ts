'use client';

import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api';

interface DashboardData {
  scheduleItems: Array<{
    date: string;
    items: Array<{
      time: string;
      title: string;
      location: string;
    }>;
  }>;
  statistics: {
    approved: number;
    pending: number;
    selecting: number;
  };
}

// Mock API function - in real implementation, this would be in a service
async function fetchDashboardData(): Promise<DashboardData> {
  // For now, using mock data that matches the original dashboard
  // In production, this would make an actual API call
  const mockData: DashboardData = {
    scheduleItems: [
      {
        date: "11 มิ.ย. 2568",
        items: [
          {
            time: "9:00 - 16:30",
            title: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4",
            location: "ธุรการ"
          },
          {
            time: "9:00 - 16:30", 
            title: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4",
            location: "ธุรการ"
          },
          {
            time: "9:00 - 16:30",
            title: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4", 
            location: "ธุรการ"
          }
        ]
      },
      {
        date: "12 มิ.ย. 2568",
        items: [
          {
            time: "9:00 - 16:30",
            title: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4",
            location: "ธุรการ"
          },
          {
            time: "9:00 - 16:30",
            title: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4",
            location: "ธุรการ"
          },
          {
            time: "9:00 - 16:30",
            title: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4",
            location: "ธุรการ"
          }
        ]
      }
    ],
    statistics: {
      approved: 60,
      pending: 20,
      selecting: 20
    }
  };

  // Simulate API delay for mobile network conditions
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockData;
}

export function useDashboard() {
  return useApiQuery<DashboardData>(
    fetchDashboardData,
    {
      refetchOnMount: true,
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      onSuccess: (data) => {
        console.log('Dashboard data loaded successfully');
      },
      onError: (error) => {
        console.error('Failed to load dashboard data:', error);
      },
    }
  );
}