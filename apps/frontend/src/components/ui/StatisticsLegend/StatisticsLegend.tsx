'use client';

interface LegendItem {
  label: string;
  color: string;
  percentage: number;
}

interface StatisticsLegendProps {
  items: LegendItem[];
}

export function StatisticsLegend({ items }: StatisticsLegendProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-8 flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="8" cy="8" r="6" fill={item.color} />
              </svg>
            </div>
            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
              {item.label}
            </p>
          </div>
          <div className="col-span-4 text-right">
            <p className="font-semibold text-sm sm:text-base text-gray-900">
              {item.percentage}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}