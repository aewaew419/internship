"use client";

import Link from "next/link";
import { useState } from "react";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

export const MobileBreadcrumb = () => {
  const breadcrumbs = useBreadcrumbs();
  const [isExpanded, setIsExpanded] = useState(false);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  // Show only last 2 items by default on mobile
  const visibleBreadcrumbs = isExpanded ? breadcrumbs : breadcrumbs.slice(-2);
  const hasHiddenItems = breadcrumbs.length > 2 && !isExpanded;

  return (
    <nav className="border-b-2 border-text-200 mt-16 pb-3 px-4" aria-label="Breadcrumb">
      <div className="flex items-center justify-between mb-2">
        <h1 className="gradient-text font-bold text-lg truncate">
          {breadcrumbs[breadcrumbs.length - 1].name}
        </h1>
        
        {hasHiddenItems && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-touch p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
            aria-label="แสดงเส้นทางทั้งหมด"
          >
            <svg
              className={`w-5 h-5 text-text-600 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      <ol className="flex items-center space-x-1 text-xs overflow-x-auto scrollbar-hide">
        {hasHiddenItems && !isExpanded && (
          <li className="flex items-center flex-shrink-0">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-text-400 hover:text-text-600 transition-colors p-1"
              aria-label="แสดงเส้นทางก่อนหน้า"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
              </svg>
            </button>
            <svg
              className="w-3 h-3 mx-1 text-text-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
        )}

        {visibleBreadcrumbs.map((item, index) => {
          const isLast = index === visibleBreadcrumbs.length - 1;
          const actualIndex = isExpanded ? index : breadcrumbs.length - visibleBreadcrumbs.length + index;
          
          return (
            <li key={`${item.path}-${actualIndex}`} className="flex items-center flex-shrink-0">
              {index > 0 && (
                <svg
                  className="w-3 h-3 mx-1 text-text-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              
              {isLast ? (
                <span className="text-primary-600 font-semibold truncate max-w-32">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="text-text-500 hover:text-text-700 transition-colors font-medium truncate max-w-24"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};