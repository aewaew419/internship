'use client';

import { DonutChart, ResponsiveChart } from '@/components/charts';
import { ScheduleCard } from '@/components/ui/ScheduleCard';
import { StatisticsLegend } from '@/components/ui/StatisticsLegend';
import { StatisticsGrid } from '@/components/ui';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useDashboard } from '@/hooks/useDashboard';

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();

  const handleRefresh = async () => {
    await refetch();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">เกิดข้อผิดพลาด: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-gray-500">
          ไม่พบข้อมูล
        </div>
      </div>
    );
  }

  const chartData = {
    labels: ["เอกสารผ่านแล้ว", "รอการพิจารณา", "กำลังเลือกบริษัท"],
    datasets: [
      {
        data: [data.statistics.approved, data.statistics.pending, data.statistics.selecting],
        backgroundColor: ["#344BFD", "#F4A79D", "#F68D2B"],
        datalabels: {
          anchor: "end" as const,
        },
      },
    ],
  };

  const legendItems = [
    {
      label: "เอกสารผ่านแล้ว",
      color: "#344BFD",
      percentage: data.statistics.approved
    },
    {
      label: "รอการพิจารณา", 
      color: "#F4A79D",
      percentage: data.statistics.pending
    },
    {
      label: "กำลังเลือกบริษัท",
      color: "#F68D2B", 
      percentage: data.statistics.selecting
    }
  ];

  // Statistics cards for the new responsive grid
  const statisticsCards = [
    {
      title: "เอกสารผ่านแล้ว",
      value: data.statistics.approved,
      subtitle: "นักศึกษา",
      color: 'success' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "รอการพิจารณา",
      value: data.statistics.pending,
      subtitle: "นักศึกษา",
      color: 'warning' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "กำลังเลือกบริษัท",
      value: data.statistics.selecting,
      subtitle: "นักศึกษา",
      color: 'primary' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    }
  ];

  return (
    <PullToRefresh 
      onRefresh={handleRefresh}
      className="min-h-screen"
      enabled={!loading}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Mobile-first grid layout */}
        <div className="space-y-6">
        
        {/* Statistics Overview - New responsive cards */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-4 sm:mb-6">
            สถิติภาพรวม
          </h2>
          <StatisticsGrid 
            cards={statisticsCards}
            columns={3}
            gap="md"
            className="mb-6"
          />
        </div>
        
        {/* Schedule Section */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-4 sm:mb-6">
            กำหนดการใกล้ถึง
          </h2>
          
          <div className="space-y-6">
            {data.scheduleItems.map((schedule, index) => (
              <div key={index}>
                <ScheduleCard 
                  date={schedule.date}
                  items={schedule.items}
                />
                {index < data.scheduleItems.length - 1 && (
                  <hr className="mt-6 mb-2 border-gray-100" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-4 sm:mb-6">
            จำนวนนักศึกษาที่ส่งเอกสารฝึกงาน
          </h2>
          
          <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6">
            {/* Chart Container - Mobile-responsive with touch support */}
            <div className="w-full mb-6">
              <ResponsiveChart 
                enableFullscreen={true}
                className="mx-auto"
              >
                <DonutChart 
                  data={chartData} 
                  enableTouch={true}
                />
              </ResponsiveChart>
            </div>
            
            {/* Legend - Mobile optimized */}
            <div className="max-w-sm mx-auto">
              <StatisticsLegend items={legendItems} />
            </div>
          </div>
        </div>

      </div>
    </PullToRefresh>
  );
}
