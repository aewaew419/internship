import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useStatusTransitionHandler } from '../../service/api/internship/hooks/useStatusTransitionHandler';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import { ApprovalStatusDisplay } from './ApprovalStatusDisplay';
import type { InternshipApprovalStatus } from '../../service/api/internship/type';

interface StatusTransitionExampleProps {
  studentEnrollId: number;
  currentStatus: InternshipApprovalStatus;
  userRole: 'advisor' | 'committee_member' | 'admin';
}

/**
 * Example component demonstrating comprehensive status transition error handling
 * Based on requirements 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3
 */
export const StatusTransitionExample: React.FC<StatusTransitionExampleProps> = ({
  studentEnrollId,
  currentStatus,
  userRole
}) => {
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<InternshipApprovalStatus>('t.approved');
  const [remarks, setRemarks] = useState('');
  
  const statusTransitionHandler = useStatusTransitionHandler();

  /**
   * Get available transitions based on current status and user role
   */
  const getAvailableTransitions = (): Array<{ value: InternshipApprovalStatus; label: string }> => {
    const transitions: Record<string, Record<InternshipApprovalStatus, Array<{ value: InternshipApprovalStatus; label: string }>>> = {
      advisor: {
        'registered': [
          { value: 't.approved', label: 'อนุมัติ (ส่งต่อคณะกรรมการ)' },
          { value: 'doc.approved', label: 'ไม่อนุมัติ' }
        ],
        't.approved': [],
        'c.approved': [],
        'doc.approved': [],
        'doc.cancel': []
      },
      committee_member: {
        'registered': [],
        't.approved': [
          { value: 'c.approved', label: 'อนุมัติ (ผ่านคณะกรรมการ)' },
          { value: 'doc.approved', label: 'ไม่อนุมัติ' }
        ],
        'c.approved': [],
        'doc.approved': [],
        'doc.cancel': []
      },
      admin: {
        'registered': [
          { value: 't.approved', label: 'อนุมัติ (ส่งต่อคณะกรรมการ)' },
          { value: 'doc.approved', label: 'ไม่อนุมัติ' }
        ],
        't.approved': [
          { value: 'c.approved', label: 'อนุมัติ (ผ่านคณะกรรมการ)' },
          { value: 'doc.approved', label: 'ไม่อนุมัติ' }
        ],
        'c.approved': [
          { value: 'doc.cancel', label: 'ยกเลิกการฝึกงาน' }
        ],
        'doc.approved': [],
        'doc.cancel': []
      }
    };

    return transitions[userRole]?.[currentStatus] || [];
  };

  /**
   * Handle transition execution
   */
  const handleExecuteTransition = async () => {
    try {
      await statusTransitionHandler.executeTransition(
        studentEnrollId,
        currentStatus,
        targetStatus,
        userRole,
        { remarks }
      );
      
      setShowTransitionDialog(false);
      setRemarks('');
    } catch (error) {
      console.error('Transition failed:', error);
    }
  };

  /**
   * Handle conflict resolution
   */
  const handleConflictResolve = async (strategy: any) => {
    try {
      await statusTransitionHandler.resolveConflict(strategy);
      setShowTransitionDialog(false);
    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }
  };

  const availableTransitions = getAvailableTransitions();

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          การจัดการสถานะการอนุมัติฝึกงาน
        </Typography>

        {/* Current Status Display */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            สถานะปัจจุบัน:
          </Typography>
          <ApprovalStatusDisplay
            studentEnrollId={studentEnrollId}
            showTimestamp={true}
            showRefreshButton={true}
          />
        </Box>

        {/* Available Actions */}
        {availableTransitions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              การดำเนินการที่สามารถทำได้:
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowTransitionDialog(true)}
              disabled={statusTransitionHandler.isLoading}
            >
              เปลี่ยนสถานะ
            </Button>
          </Box>
        )}

        {/* Error Display */}
        {statusTransitionHandler.error && (
          <Alert 
            severity="error" 
            onClose={statusTransitionHandler.clearError}
            sx={{ mb: 2 }}
            action={
              statusTransitionHandler.lastAttemptedTransition && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={statusTransitionHandler.retryLastTransition}
                  disabled={statusTransitionHandler.isLoading}
                >
                  ลองใหม่
                </Button>
              )
            }
          >
            {statusTransitionHandler.error}
          </Alert>
        )}

        {/* Loading State */}
        {statusTransitionHandler.isLoading && (
          <Alert severity="info">
            กำลังดำเนินการ...
          </Alert>
        )}
      </CardContent>

      {/* Transition Dialog */}
      <Dialog
        open={showTransitionDialog}
        onClose={() => setShowTransitionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>เปลี่ยนสถานะการอนุมัติ</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>เลือกสถานะใหม่</InputLabel>
              <Select
                value={targetStatus}
                label="เลือกสถานะใหม่"
                onChange={(e) => setTargetStatus(e.target.value as InternshipApprovalStatus)}
              >
                {availableTransitions.map((transition) => (
                  <MenuItem key={transition.value} value={transition.value}>
                    {transition.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="หมายเหตุ (ไม่บังคับ)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ระบุเหตุผลหรือข้อมูลเพิ่มเติม..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransitionDialog(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleExecuteTransition}
            variant="contained"
            disabled={statusTransitionHandler.isLoading}
          >
            {statusTransitionHandler.isLoading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>

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
        onCancel={statusTransitionHandler.dismissConflictDialog}
        isResolving={statusTransitionHandler.isLoading}
      />
    </Card>
  );
};

export default StatusTransitionExample;