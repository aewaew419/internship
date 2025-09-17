import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Block as BlockIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useApprovalStatusViewModel } from '../../service/api/internship/hooks/useApprovalStatusViewModel';
import type { InternshipApprovalStatus } from '../../service/api/internship/type';

interface CompactApprovalStatusProps {
  /**
   * Student enrollment ID to display approval status for
   */
  studentEnrollId: number;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Size variant for the chip
   */
  size?: 'small' | 'medium';
}

/**
 * Get appropriate icon for each status
 */
const getStatusIcon = (status: InternshipApprovalStatus) => {
  switch (status) {
    case 'registered':
      return <ScheduleIcon />;
    case 't.approved':
      return <GroupIcon />;
    case 'c.approved':
      return <CheckCircleIcon />;
    case 'doc.approved':
      return <CancelIcon />;
    case 'doc.cancel':
      return <BlockIcon />;
    default:
      return <ErrorIcon />;
  }
};

/**
 * CompactApprovalStatus component for displaying approval status in lists and tables
 * Based on requirements 5.1, 5.2, 5.3 - consistent styling with existing UI design
 * 
 * Features:
 * - Compact display suitable for lists and tables
 * - Exact Thai text matching UI requirements
 * - Appropriate status colors and icons from design
 * - Minimal resource usage for list views
 */
export const CompactApprovalStatus: React.FC<CompactApprovalStatusProps> = ({
  studentEnrollId,
  className = '',
  size = 'small'
}) => {
  const viewModel = useApprovalStatusViewModel(studentEnrollId, {
    enableAutoRefresh: false, // Disable auto-refresh for compact view
    refreshInterval: 0,
    refreshOnFocus: false,
    maxRetries: 1
  });

  const {
    currentStatus,
    isLoading,
    error,
    getFormattedStatusText,
    getStatusColor
  } = viewModel;

  // Loading state
  if (isLoading) {
    return (
      <Chip
        label="กำลังโหลด..."
        variant="outlined"
        size={size}
        sx={{
          borderColor: '#9E9E9E',
          color: '#9E9E9E',
          fontSize: '0.75rem'
        }}
        className={className}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <Chip
        icon={<ErrorIcon />}
        label="ข้อผิดพลาด"
        variant="filled"
        size={size}
        sx={{
          backgroundColor: '#F44336',
          color: 'white',
          fontSize: '0.75rem',
          '& .MuiChip-icon': {
            color: 'white',
          },
        }}
        className={className}
      />
    );
  }

  // No status data
  if (!currentStatus) {
    return (
      <Chip
        icon={<ErrorIcon />}
        label="ไม่พบข้อมูล"
        variant="outlined"
        size={size}
        sx={{
          borderColor: '#9E9E9E',
          color: '#9E9E9E',
          fontSize: '0.75rem',
          '& .MuiChip-icon': {
            color: '#9E9E9E',
          },
        }}
        className={className}
      />
    );
  }

  const statusText = getFormattedStatusText();
  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon(currentStatus);

  return (
    <Chip
      icon={statusIcon}
      label={statusText}
      variant="filled"
      size={size}
      sx={{
        backgroundColor: statusColor,
        color: 'white',
        fontWeight: 'medium',
        fontSize: '0.75rem',
        maxWidth: '200px',
        '& .MuiChip-icon': {
          color: 'white',
        },
        '&:hover': {
          backgroundColor: statusColor,
          opacity: 0.9,
        },
      }}
      className={className}
    />
  );
};

export default CompactApprovalStatus;