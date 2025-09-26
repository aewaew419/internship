import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  Card, 
  CardContent,
  Skeleton,
  Stack
} from '@mui/material';
import { 
  Refresh, 
  CloudOff, 
  ErrorOutline, 
  WifiOff,
  Warning
} from '@mui/icons-material';
import { ErrorType, type EnhancedError } from '../../utils/errorHandling';

interface FallbackUIProps {
  error?: EnhancedError;
  onRetry?: () => void;
  onRefresh?: () => void;
  showSkeleton?: boolean;
  title?: string;
  description?: string;
}

// Skeleton loader for table data
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Box sx={{ width: '100%' }}>
    {Array.from({ length: rows }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Skeleton variant="rectangular" width={40} height={40} />
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="15%" />
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="15%" />
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
    ))}
  </Box>
);

// Main fallback UI component
const FallbackUI: React.FC<FallbackUIProps> = ({
  error,
  onRetry,
  onRefresh,
  showSkeleton = false,
  title,
  description
}) => {
  // Show skeleton loader during loading states
  if (showSkeleton) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          กำลังโหลดข้อมูล...
        </Typography>
        <TableSkeleton />
      </Box>
    );
  }

  // Show error-specific UI
  if (error) {
    return <ErrorFallback error={error} onRetry={onRetry} onRefresh={onRefresh} />;
  }

  // Generic fallback
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: 300,
      p: 3 
    }}>
      <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {title || 'ไม่พบข้อมูล'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        {description || 'ไม่มีข้อมูลให้แสดงในขณะนี้'}
      </Typography>
      <Stack direction="row" spacing={2}>
        {onRetry && (
          <Button 
            variant="contained" 
            startIcon={<Refresh />}
            onClick={onRetry}
          >
            ลองใหม่
          </Button>
        )}
        {onRefresh && (
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            รีเฟรช
          </Button>
        )}
      </Stack>
    </Box>
  );
};

// Error-specific fallback component
const ErrorFallback: React.FC<{
  error: EnhancedError;
  onRetry?: () => void;
  onRefresh?: () => void;
}> = ({ error, onRetry, onRefresh }) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return <WifiOff sx={{ fontSize: 64, color: 'error.main' }} />;
      case ErrorType.TIMEOUT_ERROR:
        return <CloudOff sx={{ fontSize: 64, color: 'warning.main' }} />;
      case ErrorType.SERVER_ERROR:
        return <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />;
      default:
        return <Warning sx={{ fontSize: 64, color: 'warning.main' }} />;
    }
  };

  const getSeverity = () => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.SERVER_ERROR:
        return 'error';
      case ErrorType.TIMEOUT_ERROR:
        return 'warning';
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert 
        severity={getSeverity() as any}
        sx={{ mb: 3 }}
        action={
          <Stack direction="row" spacing={1}>
            {error.isRetryable && onRetry && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={onRetry}
                startIcon={<Refresh />}
              >
                ลองใหม่
              </Button>
            )}
            {onRefresh && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={onRefresh}
                startIcon={<Refresh />}
              >
                รีเฟรช
              </Button>
            )}
          </Stack>
        }
      >
        <Typography variant="h6" component="div" gutterBottom>
          {error.userMessage}
        </Typography>
        {process.env.NODE_ENV === 'development' && error.technicalMessage && (
          <Typography variant="caption" component="div" sx={{ mt: 1, opacity: 0.7 }}>
            Technical: {error.technicalMessage}
          </Typography>
        )}
      </Alert>

      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {getErrorIcon()}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            เกิดข้อผิดพลาดในการโหลดข้อมูล
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error.userMessage}
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            {error.isRetryable && onRetry && (
              <Button 
                variant="contained" 
                startIcon={<Refresh />}
                onClick={onRetry}
              >
                ลองใหม่
              </Button>
            )}
            {onRefresh && (
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={onRefresh}
              >
                รีเฟรชหน้า
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FallbackUI;