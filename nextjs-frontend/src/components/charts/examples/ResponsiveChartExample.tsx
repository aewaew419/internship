'use client';

import { DonutChart, ResponsiveChart } from '@/components/charts';

export function ResponsiveChartExample() {
  // Sample data for demonstration
  const sampleData = {
    labels: ["เอกสารผ่านแล้ว", "รอการพิจารณา", "กำลังเลือกบริษัท"],
    datasets: [
      {
        data: [45, 30, 25],
        backgroundColor: ["#344BFD", "#F4A79D", "#F68D2B"],
        datalabels: {
          anchor: "end" as const,
        },
      },
    ],
  };

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Responsive Chart Examples
      </h2>

      {/* Basic Responsive Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Responsive Chart</h3>
        <ResponsiveChart>
          <DonutChart data={sampleData} />
        </ResponsiveChart>
      </div>

      {/* Chart with Fullscreen Support */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Chart with Fullscreen Support</h3>
        <ResponsiveChart enableFullscreen={true}>
          <DonutChart data={sampleData} enableTouch={true} />
        </ResponsiveChart>
      </div>

      {/* Custom Sized Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Sized Chart</h3>
        <ResponsiveChart 
          minHeight={150} 
          maxHeight={400}
          aspectRatio={1.2}
        >
          <DonutChart data={sampleData} />
        </ResponsiveChart>
      </div>

      {/* Multiple Charts Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Multiple Charts (Responsive Grid)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Chart {index}</h4>
              <ResponsiveChart minHeight={120} maxHeight={200}>
                <DonutChart 
                  data={{
                    ...sampleData,
                    datasets: [{
                      ...sampleData.datasets[0],
                      data: [
                        Math.random() * 50 + 10,
                        Math.random() * 30 + 10,
                        Math.random() * 40 + 10
                      ]
                    }]
                  }}
                />
              </ResponsiveChart>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile-Optimized Features Demo */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Mobile Features Demo</h3>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>• Touch interactions enabled</p>
            <p>• Responsive sizing based on screen size</p>
            <p>• Fullscreen support on mobile devices</p>
            <p>• Optimized touch targets and tooltips</p>
            <p>• Haptic feedback on supported devices</p>
          </div>
          <ResponsiveChart 
            enableFullscreen={true}
            className="border-2 border-dashed border-gray-300"
          >
            <DonutChart 
              data={sampleData} 
              enableTouch={true}
            />
          </ResponsiveChart>
        </div>
      </div>
    </div>
  );
}