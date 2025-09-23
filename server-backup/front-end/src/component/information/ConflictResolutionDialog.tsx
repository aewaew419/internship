import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Chip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import type { ConflictResolutionStrategy } from '../../service/api/internship/enhanced-error-handling';
import type { InternshipApprovalStatus } from '../../service/api/internship/type';
import { getStatusText } from '../../service/api/internship/config';

interface ConflictResolutionDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Conflict data from the server
   */
  conflictData: {
    currentStatus: InternshipApprovalStatus;
    serverStatus: InternshipApprovalStatus;
    lastModifiedBy: string;
    lastModifiedAt: string;
    clientTimestamp: string;
    serverTimestamp: string;
  } | null;
  
  /**
   * The status transition that was attempted
   */
  attemptedTransition: {
    currentStatus: InternshipApprovalStatus;
    targetStatus: InternshipApprovalStatus;
    userRole: string;
  } | null;
  
  /**
   * Callback when user selects a resolution strategy
   */
  onResolve: (strategy: ConflictResolutionStrategy) => void;
  
  /**
   * Callback when user cancels the dialog
   */
  onCancel: () => void;
  
  /**
   * Whether the resolution is in progress
   */
  isResolving?: boolean;
}

/**
 * ConflictResolutionDialog component for handling concurrent update conflicts
 * Based on requirement 4.4 - concurrent update conflict resolution
 */
export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  conflictData,
  attemptedTransition,
  onResolve,
  onCancel,
  isResolving = false
}) => {
  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Handle overwrite resolution
   */
  const handleOverwrite = () => {
    onResolve({ type: 'overwrite' });
  };

  /**
   * Handle abort resolution
   */
  const handleAbort = () => {
    onResolve({ type: 'abort' });
  };

  if (!conflictData || !attemptedTransition) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isResolving}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            ตรวจพบการเปลี่ยนแปลงข้อมูลพร้อมกัน
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            สถานะของใบสมัครนี้ได้ถูกเปลี่ยนแปลงโดยผู้ใช้อื่นในขณะที่คุณกำลังดำเนินการ 
            กรุณาเลือกวิธีการแก้ไขปัญหานี้
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            ข้อมูลการเปลี่ยนแปลง:
          </Typography>
          
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>สถานะที่คุณเห็น:</strong>
            </Typography>
            <Chip 
              label={getStatusText(conflictData.currentStatus)}
              size="small"
              sx={{ mb: 1 }}
            />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>สถานะปัจจุบันในระบบ:</strong>
            </Typography>
            <Chip 
              label={getStatusText(conflictData.serverStatus)}
              size="small"
              color="warning"
              sx={{ mb: 1 }}
            />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>สถานะที่คุณต้องการเปลี่ยน:</strong>
            </Typography>
            <Chip 
              label={getStatusText(attemptedTransition.targetStatus)}
              size="small"
              color="primary"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              <strong>เปลี่ยนแปลงโดย:</strong> {conflictData.lastModifiedBy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>เวลาที่เปลี่ยนแปลง:</strong> {formatTimestamp(conflictData.lastModifiedAt)}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            ตัวเลือกการแก้ไข:
          </Typography>
          
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>1. บังคับเปลี่ยนแปลง:</strong> ดำเนินการเปลี่ยนสถานะตามที่คุณต้องการ 
              โดยเขียนทับการเปลี่ยนแปลงของผู้ใช้อื่น
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>2. ยกเลิกการดำเนินการ:</strong> ยกเลิกการเปลี่ยนสถานะและกลับไปดูข้อมูลล่าสุด
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={handleAbort}
          disabled={isResolving}
          startIcon={<CancelIcon />}
        >
          ยกเลิก
        </Button>
        
        <Button
          onClick={handleOverwrite}
          disabled={isResolving}
          variant="contained"
          color="warning"
          startIcon={<RefreshIcon />}
        >
          {isResolving ? 'กำลังดำเนินการ...' : 'บังคับเปลี่ยนแปลง'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConflictResolutionDialog;