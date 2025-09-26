import React, { useState, useEffect } from 'react';
import { 
  Chip, 
  Tooltip, 
  IconButton, 
  Box, 
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Refresh, 
  Warning, 
  CheckCircle, 
  WifiOff, 
  Schedule,
  Settings,
  Sync,
  SyncDisabled,
  NetworkCheck,
  Timer,
  MoreVert
} from '@mui/icons-material';
import { DataStalenessInfo } from '../../utils/realTimeUpdates';

interface DataStalenessIndicatorProps {
  stalenessInfo: DataStalenessInfo;
  isRefreshing?: boolean;
  isAutoRefreshing?: boolean;
  onManualRefresh?: () => void;
  onToggleAutoRefresh?: () => void;
  className?: string;
  // Enhanced props
  showSettings?: boolean;
  refreshInterval?: number;
  onRefreshIntervalChange?: (interval: number) => void;
  connectionStatus?: 'online' | 'offline' | 'unstable';
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onForceSync?: () => void;
}

/**
 * Component to display data staleness information and refresh controls
 */
export const DataStalenessIndicator: React.FC<DataStalenessIndicatorProps> = ({
  stalenessInfo,
  isRefreshing = false,
  isAutoRefreshing = false,
  onManualRefresh,
  onToggleAutoRefresh,
  className = '',
  // Enhanced props
  showSettings = false,
  refreshInterval = 30000,
  onRefreshIntervalChange,
  connectionStatus = 'online',
  isSyncing = false,
  lastSyncTime,
  onForceSync
}) => {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState<number>(0);

  // Countdown timer for next refresh
  useEffect(() => {
    if (!isAutoRefreshing || !stalenessInfo.nextRefreshTime) {
      setNextRefreshCountdown(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = stalenessInfo.nextRefreshTime!.getTime() - now.getTime();
      setNextRefreshCountdown(Math.max(0, Math.ceil(diff / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, stalenessInfo.nextRefreshTime]);
  // Format time duration for display
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes % 60} นาที`;
    } else if (minutes > 0) {
      return `${minutes} นาที ${seconds % 60} วินาที`;
    } else {
      return `${seconds} วินาที`;
    }
  };

  // Format next refresh time
  const formatNextRefresh = (nextRefreshTime: Date | null): string => {
    if (!nextRefreshTime) return '';
    
    const now = new Date();
    const diff = nextRefreshTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'กำลังรีเฟรช...';
    
    const seconds = Math.ceil(diff / 1000);
    return `รีเฟรชอัตโนมัติใน ${seconds} วินาที`;
  };

  // Handle settings menu
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleRefreshIntervalChange = (interval: number) => {
    if (onRefreshIntervalChange) {
      onRefreshIntervalChange(interval);
    }
    handleSettingsClose();
  };

  // Determine status and styling
  const getStatusInfo = () => {
    if (isRefreshing || isSyncing) {
      return {
        color: 'info' as const,
        icon: <CircularProgress size={16} />,
        label: isSyncing ? 'กำลังซิงค์...' : 'กำลังอัปเดต...',
        tooltip: isSyncing ? 'กำลังซิงโครไนซ์ข้อมูล' : 'กำลังดึงข้อมูลใหม่'
      };
    }
    
    if (connectionStatus === 'offline') {
      return {
        color: 'error' as const,
        icon: <WifiOff />,
        label: 'ออฟไลน์',
        tooltip: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต'
      };
    }
    
    if (stalenessInfo.failureCount > 0) {
      return {
        color: 'error' as const,
        icon: <WifiOff />,
        label: `ข้อผิดพลาด (${stalenessInfo.failureCount})`,
        tooltip: `การอัปเดตล้มเหลว ${stalenessInfo.failureCount} ครั้ง`
      };
    }
    
    if (stalenessInfo.isStale) {
      return {
        color: 'warning' as const,
        icon: <Warning />,
        label: 'ข้อมูลล้าสมัย',
        tooltip: `ข้อมูลล้าสมัยมาแล้ว ${formatDuration(stalenessInfo.staleDuration)}`
      };
    }
    
    return {
      color: 'success' as const,
      icon: <CheckCircle />,
      label: 'ข้อมูลล่าสุด',
      tooltip: stalenessInfo.lastUpdateTime 
        ? `อัปเดตล่าสุด: ${stalenessInfo.lastUpdateTime.toLocaleString('th-TH')}`
        : 'ข้อมูลล่าสุด'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Box className={`flex items-center gap-2 ${className}`}>
      {/* Status Indicator */}
      <Tooltip title={statusInfo.tooltip}>
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
          variant="outlined"
        />
      </Tooltip>

      {/* Auto-refresh Status with Countdown */}
      {isAutoRefreshing && (
        <Tooltip title={
          nextRefreshCountdown > 0 
            ? `รีเฟรชอัตโนมัติใน ${nextRefreshCountdown} วินาที`
            : 'รีเฟรชอัตโนมัติเปิดใช้งาน'
        }>
          <Chip
            icon={<Schedule />}
            label={nextRefreshCountdown > 0 ? `${nextRefreshCountdown}s` : 'อัตโนมัติ'}
            color="primary"
            size="small"
            variant="outlined"
            onClick={onToggleAutoRefresh}
            clickable={!!onToggleAutoRefresh}
          />
        </Tooltip>
      )}

      {/* Connection Status Indicator */}
      {connectionStatus !== 'online' && (
        <Tooltip title={
          connectionStatus === 'offline' 
            ? 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' 
            : 'การเชื่อมต่อไม่เสถียร'
        }>
          <Chip
            icon={connectionStatus === 'offline' ? <WifiOff /> : <NetworkCheck />}
            label={connectionStatus === 'offline' ? 'ออฟไลน์' : 'ไม่เสถียร'}
            color="error"
            size="small"
            variant="outlined"
          />
        </Tooltip>
      )}

      {/* Manual Refresh Button */}
      {onManualRefresh && (
        <Tooltip title="รีเฟรชข้อมูลด้วยตนเอง">
          <IconButton
            size="small"
            onClick={onManualRefresh}
            disabled={isRefreshing || isSyncing}
            color={stalenessInfo.isStale ? 'warning' : 'default'}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      )}

      {/* Force Sync Button */}
      {onForceSync && (
        <Tooltip title="บังคับซิงโครไนซ์ข้อมูล">
          <IconButton
            size="small"
            onClick={onForceSync}
            disabled={isRefreshing || isSyncing}
            color="primary"
          >
            <Sync />
          </IconButton>
        </Tooltip>
      )}

      {/* Settings Menu */}
      {showSettings && (
        <>
          <Tooltip title="ตั้งค่าการอัปเดตข้อมูล">
            <IconButton
              size="small"
              onClick={handleSettingsClick}
              color="default"
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsClose}
            PaperProps={{
              sx: { minWidth: 250 }
            }}
          >
            <MenuItem>
              <ListItemIcon>
                <Timer />
              </ListItemIcon>
              <ListItemText primary="ช่วงเวลาการรีเฟรช" />
            </MenuItem>
            <MenuItem onClick={() => handleRefreshIntervalChange(10000)}>
              <ListItemText primary="10 วินาที" secondary="รีเฟรชบ่อย" />
            </MenuItem>
            <MenuItem onClick={() => handleRefreshIntervalChange(30000)}>
              <ListItemText primary="30 วินาที" secondary="ปกติ" />
            </MenuItem>
            <MenuItem onClick={() => handleRefreshIntervalChange(60000)}>
              <ListItemText primary="1 นาที" secondary="ประหยัดแบตเตอรี่" />
            </MenuItem>
            <MenuItem onClick={() => handleRefreshIntervalChange(300000)}>
              <ListItemText primary="5 นาที" secondary="รีเฟรชน้อย" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={onToggleAutoRefresh}>
              <ListItemIcon>
                {isAutoRefreshing ? <SyncDisabled /> : <Sync />}
              </ListItemIcon>
              <ListItemText primary={isAutoRefreshing ? 'ปิดการรีเฟรชอัตโนมัติ' : 'เปิดการรีเฟรชอัตโนมัติ'} />
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Detailed Information */}
      {(stalenessInfo.lastUpdateTime || lastSyncTime) && (
        <Typography variant="caption" color="text.secondary">
          {lastSyncTime ? (
            <>ซิงค์ล่าสุด: {lastSyncTime.toLocaleTimeString('th-TH')}</>
          ) : (
            <>อัปเดตล่าสุด: {stalenessInfo.lastUpdateTime!.toLocaleTimeString('th-TH')}</>
          )}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Compact version of the staleness indicator for use in headers or toolbars
 */
export const CompactDataStalenessIndicator: React.FC<DataStalenessIndicatorProps> = ({
  stalenessInfo,
  isRefreshing = false,
  onManualRefresh,
  className = ''
}) => {
  const getStatusColor = () => {
    if (isRefreshing) return 'info';
    if (stalenessInfo.failureCount > 0) return 'error';
    if (stalenessInfo.isStale) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (isRefreshing) return <CircularProgress size={14} />;
    if (stalenessInfo.failureCount > 0) return <WifiOff fontSize="small" />;
    if (stalenessInfo.isStale) return <Warning fontSize="small" />;
    return <CheckCircle fontSize="small" />;
  };

  const getTooltipText = () => {
    if (isRefreshing) return 'กำลังอัปเดตข้อมูล';
    if (stalenessInfo.failureCount > 0) return `การอัปเดตล้มเหลว ${stalenessInfo.failureCount} ครั้ง`;
    if (stalenessInfo.isStale) return 'ข้อมูลล้าสมัย - คลิกเพื่อรีเฟรช';
    return 'ข้อมูลล่าสุด';
  };

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        size="small"
        onClick={onManualRefresh}
        disabled={isRefreshing || !onManualRefresh}
        color={getStatusColor() as any}
        className={className}
      >
        {getStatusIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default DataStalenessIndicator;