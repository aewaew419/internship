'use client';

interface ScheduleItem {
  time: string;
  title: string;
  location: string;
}

interface ScheduleCardProps {
  date: string;
  items: ScheduleItem[];
}

export function ScheduleCard({ date, items }: ScheduleCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="text-right mb-2 sm:mb-0 sm:mt-auto min-w-fit">
          <p className="text-sm sm:text-base">{date}</p>
        </div>
        <div className="flex-1 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 bg-gray-50 rounded-lg px-3 sm:px-5 py-3 gap-2 sm:gap-0"
            >
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-600">{item.time}</p>
              </div>
              <div className="sm:col-span-8">
                <p className="font-semibold text-gray-900">{item.title}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-600">{item.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}