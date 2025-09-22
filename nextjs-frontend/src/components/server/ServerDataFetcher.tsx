import { Suspense } from 'react';

// Server component for fetching static data
async function fetchStaticData() {
  // This would be replaced with actual server-side data fetching
  // For example, fetching configuration data, static lists, etc.
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    campuses: [
      { id: 1, name: 'Main Campus' },
      { id: 2, name: 'Branch Campus' },
    ],
    faculties: [
      { id: 1, name: 'Engineering' },
      { id: 2, name: 'Science' },
    ],
  };
}

// Server component that fetches data at build time or request time
export async function ServerDataFetcher() {
  const data = await fetchStaticData();
  
  return (
    <div className="hidden" data-static-data={JSON.stringify(data)}>
      {/* This component provides static data to client components */}
    </div>
  );
}

// Loading component for server data
export function ServerDataLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Wrapper component with Suspense
export function ServerDataProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ServerDataLoading />}>
      <ServerDataFetcher />
      {children}
    </Suspense>
  );
}