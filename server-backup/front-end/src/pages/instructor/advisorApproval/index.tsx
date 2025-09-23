import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material'
import { useAdvisorApprovalViewModel } from '../../../viewModel/internship/useAdvisorApprovalViewModel'

/**
 * Advisor Approval Interface - Main component for advisor approval workflow
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export const AdvisorApprovalInterface: React.FC = () => {
  const {
    applications,
    loading,
    error,
    submitApproval,
    refreshApplications
  } = useAdvisorApprovalViewModel()

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: '',
    studentId: null as number | null,
    remarks: ''
  })

  useEffect(() => {
    refreshApplications()
  }, [refreshApplications])

  const handleApprovalAction = (studentId: number, action: 'approve' | 'reject') => {
    setConfirmDialog({
      open: true,
      action,
      studentId,
      remarks: ''
    })
  }

  const handleConfirmAction = async () => {
    if (confirmDialog.studentId && confirmDialog.action) {
      await submitApproval(
        confirmDialog.studentId,
        confirmDialog.action === 'approve',
        confirmDialog.remarks
      )
      setConfirmDialog({ open: false, action: '', studentId: null, remarks: '' })
      refreshApplications()
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        การอนุมัติใบสมัครฝึกงาน/สหกิจ
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>รหัสนักศึกษา</TableCell>
              <TableCell>ชื่อ-นามสกุล</TableCell>
              <TableCell>บริษัท</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>การดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.studentId}</TableCell>
                <TableCell>{app.studentName}</TableCell>
                <TableCell>{app.companyName}</TableCell>
                <TableCell>
                  <Chip
                    label={app.statusText}
                    color={app.status === 'registered' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {app.status === 'registered' && (
                    <Box>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApprovalAction(app.id, 'approve')}
                        sx={{ mr: 1 }}
                      >
                        อนุมัติ
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleApprovalAction(app.id, 'reject')}
                      >
                        ไม่อนุมัติ
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>
          {confirmDialog.action === 'approve' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการไม่อนุมัติ'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="หมายเหตุ"
            value={confirmDialog.remarks}
            onChange={(e) => setConfirmDialog({ ...confirmDialog, remarks: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            ยกเลิก
          </Button>
          <Button onClick={handleConfirmAction} variant="contained">
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}