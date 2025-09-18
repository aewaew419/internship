import React, { useState } from 'react';
import { Chip, CircularProgress, Button, Alert, Snackbar } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Block as BlockIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApprovalStatusViewModel } from '../../service/api/internship/hooks/useApprovalStatusViewModel';
import { useStatusTransitionHandler } from '../../service/api/internship/hooks/useStatusTransitionHandler';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import type { InternshipApprovalStatus } from '../../service/api/internship/type';
import type { ConflictResolutionStrategy } from '../../service/api/internship/enhanced-error-handling';

interface ApprovalStatusDisplayProps {
  /**
   * Student enrollment ID to display approval status for
   */
  studentEnrollId: number;
  /**
   * Whether to show the timestamp alongside the status
   */
  showTimestamp?: boolean;
  /**
   * Whether to show refresh button for manual refresh
   */
  showRefreshButton?: boolean;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Compact mode for smaller displays
   */
  compact?: boolean;
  /**
   * Configuration for auto-refresh behavior
   */
  autoRefreshConfig?: {
    enabled?: boolean;
    interval?: number;
  };
}

/**
 * Get appropriate icon for each status
 * Based on requirements 5.2 - appropriate status icons from design
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
 * ApprovalStatusDisplay component displays internship approval status
 * Based on requirements 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3
 * 
 * Features:
 * - Displays exact Thai text matching UI requirements
 * - Shows appropriate status colors and icons from design
 * - Includes loading and error states for status display
 * - Real-time status updates
 * - Manual refresh capability
 * - Compact mode for space-constrained layouts
 */
export const ApprovalStatusDisplay: React.FC<ApprovalStatusDisplayProps> = ({
  studentEnrollId,
  showTimestamp = false,
  showRefreshButton = false,
  className = '',
  compact = false,
  autoRefreshConfig = { enabled: true, interval: 30000 }
}) => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const viewModel = useApprovalStatusViewModel(studentEnrollId, {
    enableAutoRefresh: autoRefreshConfig.enabled,
    refreshInterval: autoRefreshConfig.interval,
    refreshOnFocus: true,
    maxRetries: 3
  });

  const statusTransitionHandler = useStatusTransitionHandler();

  const {
    currentStatus,
    isLoading,
    isRefreshing,
    error,
    approvalStatus,
    getFormattedStatusText,
    getStatusColor,
    refreshStatus,
    retryFetch,
    clearError,
    canRetry,
    lastRefreshTime
  } = viewModel;

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    try {
      await refreshStatus();
    } catch (err) {
      console.error('Manual refresh failed:', err);
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = async () => {
    try {
      clearError();
      await retryFetch();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  /**
   * Handle conflict resolution
   */
  const handleConflictResolve = async (strategy: ConflictResolutionStrategy) => {
    try {
      await statusTransitionHandler.resolveConflict(strategy);
      setShowSuccessMessage(true);
      // Refresh the status after successful resolution
      await refreshStatus();
    } catch (err) {
      console.error('Conflict resolution failed:', err);
    }
  };

  /**
   * Handle conflict dialog cancellation
   */
  const handleConflictCancel = () => {
    statusTransitionHandler.dismissConflictDialog();
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string | Date | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <CircularProgress size={compact ? 16 : 20} />
        <span className={`text-text-600 ${compact ? 'text-sm' : 'text-base'}`}>
          กำลังโหลดสถานะ...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Chip
          icon={<ErrorIcon />}
          label="เกิดข้อผิดพลาด"
          variant="filled"
          size={compact ? 'small' : 'medium'}
          sx={{
            backgroundColor: '#F44336',
            color: 'white',
            fontWeight: 'medium',
            '& .MuiChip-icon': {
              color: 'white',
            },
          }}
        />
        {canRetry && (
          <button
            onClick={handleRetry}
            className="text-primary-600 hover:text-primary-700 text-sm underline"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'กำลังลองใหม่...' : 'ลองใหม่'}
          </button>
        )}
      </div>
    );
  }

  // No status data
  if (!currentStatus || !approvalStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Chip
          icon={<ErrorIcon />}
          label="ไม่พบข้อมูลสถานะ"
          variant="outlined"
          size={compact ? 'small' : 'medium'}
          sx={{
            borderColor: '#9E9E9E',
            color: '#9E9E9E',
            '& .MuiChip-icon': {
              color: '#9E9E9E',
            },
          }}
        />
      </div>
    );
  }

  const statusText = getFormattedStatusText();
  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon(currentStatus);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main status chip */}
      <Chip
        icon={statusIcon}
        label={statusText}
        variant="filled"
        size={compact ? 'small' : 'medium'}
        sx={{
          backgroundColor: statusColor,
          color: 'white',
          fontWeight: 'medium',
          fontSize: compact ? '0.75rem' : '0.875rem',
          '& .MuiChip-icon': {
            color: 'white',
          },
          '&:hover': {
            backgroundColor: statusColor,
            opacity: 0.9,
          },
        }}
      />

      {/* Refreshing indicator */}
      {isRefreshing && (
        <CircularProgress size={compact ? 12 : 16} />
      )}

      {/* Manual refresh button */}
      {showRefreshButton && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-text-600 hover:text-text-800 transition-colors duration-200"
          title="รีเฟรชสถานะ"
        >
          <RefreshIcon fontSize={compact ? 'small' : 'medium'} />
        </button>
      )}

      {/* Timestamp display */}
      {showTimestamp && (
        <div className="flex flex-col text-xs text-text-600">
          {approvalStatus.statusUpdatedAt && (
            <span>
              อัปเดต: {formatTimestamp(approvalStatus.statusUpdatedAt)}
            </span>
          )}
          {lastRefreshTime && (
            <span>
              ตรวจสอบล่าสุด: {formatTimestamp(lastRefreshTime)}
            </span>
          )}
        </div>
      )}

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={statusTransitionHandler.isConflictDialogOpen}
        conflictData={statusTransitionHandler.conflictData}
        attemptedTransition={statusTransitionHandler.lastAttemptedTransition ? {
          currentStatus: statusTransitionHandler.lastAttemptedTransition.currentStatus,
          targetStatus: statusTransitionHandler.lastAttemptedTransition.targetStatus,
          userRole: statusTransitionHandler.lastAttemptedTransition.userRole
        } : null}
        onResolve={handleConflictResolve}
        onCancel={handleConflictCancel}
        isResolving={statusTransitionHandler.isLoading}
      />

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccessMessage(false)}>
          การดำเนินการสำเร็จแล้ว
        </Alert>
      </Snackbar>

      {/* Status Transition Error Display */}
      {statusTransitionHandler.error && (
        <Alert 
          severity="error" 
          onClose={statusTransitionHandler.clearError}
          sx={{ mt: 1 }}
        >
          {statusTransitionHandler.error}
          {statusTransitionHandler.lastAttemptedTransition && (
            <Button
              size="small"
              onClick={statusTransitionHandler.retryLastTransition}
              disabled={statusTransitionHandler.isLoading}
              sx={{ ml: 1 }}
            >
              ลองใหม่
            </Button>
          )}
        </Alert>
      )}
    </div>
  );
};

export default ApprovalStatusDisplay;