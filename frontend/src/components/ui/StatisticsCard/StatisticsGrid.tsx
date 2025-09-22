'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { StatisticsCard, StatisticsCardProps } from './StatisticsCard';

export interface StatisticsGridProps {
  cards: StatisticsCardProps[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8'
};

export const StatisticsGrid: React.FC<StatisticsGridProps> = ({
  cards,
  columns = 3,
  className,
  gap = 'md'
}) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        ไม่มีข้อมูลสถิติ
      </div>
    );
  }

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {cards.map((card, index) => (
        <StatisticsCard
          key={index}
          {...card}
        />
      ))}
    </div>
  );
};

export default StatisticsGrid;