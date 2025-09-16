import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataStalenessIndicator, CompactDataStalenessIndicator } from '../DataStalenessIndicator';
import type { DataStalenessInfo } from '../../../utils/realTimeUpdates';

describe('DataStalenessIndicator', () => {
  const mockStalenessInfo: DataStalenessInfo = {
    isStale: false,
    lastUpdateTime: new Date('2024-01-01T12:00:00Z'),
    staleDuration: 0,
    failureCount: 0,
    nextRefreshTime: new Date('2024-01-01T12:00:30Z')
  };

  it('should render success state when data is fresh', () => {
    render(
      <DataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={false}
        isAutoRefreshing={true}
      />
    );

    expect(screen.getByText('ข้อมูลล่าสุด')).toBeInTheDocument();
    expect(screen.getByText('อัตโนมัติ')).toBeInTheDocument();
  });

  it('should render warning state when data is stale', () => {
    const staleStalenessInfo: DataStalenessInfo = {
      ...mockStalenessInfo,
      isStale: true,
      staleDuration: 60000 // 1 minute
    };

    render(
      <DataStalenessIndicator
        stalenessInfo={staleStalenessInfo}
        isRefreshing={false}
        isAutoRefreshing={true}
      />
    );

    expect(screen.getByText('ข้อมูลล้าสมัย')).toBeInTheDocument();
  });

  it('should render error state when there are failures', () => {
    const errorStalenessInfo: DataStalenessInfo = {
      ...mockStalenessInfo,
      failureCount: 2
    };

    render(
      <DataStalenessIndicator
        stalenessInfo={errorStalenessInfo}
        isRefreshing={false}
        isAutoRefreshing={true}
      />
    );

    expect(screen.getByText('ข้อผิดพลาด (2)')).toBeInTheDocument();
  });

  it('should render refreshing state', () => {
    render(
      <DataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={true}
        isAutoRefreshing={true}
      />
    );

    expect(screen.getByText('กำลังอัปเดต...')).toBeInTheDocument();
  });

  it('should call onManualRefresh when refresh button is clicked', () => {
    const mockOnManualRefresh = vi.fn();

    render(
      <DataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={false}
        isAutoRefreshing={true}
        onManualRefresh={mockOnManualRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /รีเฟรชข้อมูลด้วยตนเอง/i });
    fireEvent.click(refreshButton);

    expect(mockOnManualRefresh).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleAutoRefresh when auto-refresh chip is clicked', () => {
    const mockOnToggleAutoRefresh = vi.fn();

    render(
      <DataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={false}
        isAutoRefreshing={true}
        onToggleAutoRefresh={mockOnToggleAutoRefresh}
      />
    );

    const autoRefreshChip = screen.getByText('อัตโนมัติ');
    fireEvent.click(autoRefreshChip);

    expect(mockOnToggleAutoRefresh).toHaveBeenCalledTimes(1);
  });

  it('should disable refresh button when refreshing', () => {
    const mockOnManualRefresh = vi.fn();

    render(
      <DataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={true}
        isAutoRefreshing={true}
        onManualRefresh={mockOnManualRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /รีเฟรชข้อมูลด้วยตนเอง/i });
    expect(refreshButton).toBeDisabled();
  });

  it('should display last update time', () => {
    render(
      <DataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={false}
        isAutoRefreshing={true}
      />
    );

    expect(screen.getByText(/อัปเดตล่าสุด:/)).toBeInTheDocument();
  });
});

describe('CompactDataStalenessIndicator', () => {
  const mockStalenessInfo: DataStalenessInfo = {
    isStale: false,
    lastUpdateTime: new Date('2024-01-01T12:00:00Z'),
    staleDuration: 0,
    failureCount: 0,
    nextRefreshTime: null
  };

  it('should render compact version with success icon', () => {
    render(
      <CompactDataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={false}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render warning icon when data is stale', () => {
    const staleStalenessInfo: DataStalenessInfo = {
      ...mockStalenessInfo,
      isStale: true
    };

    render(
      <CompactDataStalenessIndicator
        stalenessInfo={staleStalenessInfo}
        isRefreshing={false}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should call onManualRefresh when clicked', () => {
    const mockOnManualRefresh = vi.fn();

    render(
      <CompactDataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={false}
        onManualRefresh={mockOnManualRefresh}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnManualRefresh).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when refreshing', () => {
    render(
      <CompactDataStalenessIndicator
        stalenessInfo={mockStalenessInfo}
        isRefreshing={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});