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
  LinearProgress,
  Alert
} from '@mui/material'
import { useCommitteeVotingViewModel } from '../../../viewModel/internship/useCommitteeVotingViewModel'

/**
 * Committee Voting Interface - Main component for committee voting workflow
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export const CommitteeVotingInterface: React.FC = () => {
  const {
    applications,
    loading,
    error,
    submitVote,
    refreshApplications
  } = useCommitteeVotingViewModel()

  const [voteDialog, setVoteDialog] = useState({
    open: false,
    studentId: null as number | null,
    vote: '',
    remarks: ''
  })

  useEffect(() => {
    refreshApplications()
  }, [refreshApplications])

  const handleVoteAction = (studentId: number, vote: 'approve' | 'reject') => {
    setVoteDialog({
      open: true,
      studentId,
      vote,
      remarks: ''
    })
  }

  const handleConfirmVote = async () => {
    if (voteDialog.studentId && voteDialog.vote) {
      await submitVote(
        voteDialog.studentId,
        voteDialog.vote,
        voteDialog.remarks
      )
      setVoteDialog({ open: false, studentId: null, vote: '', remarks: '' })
      refreshApplications()
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        การลงคะแนนของคณะกรรมการ
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
              <TableCell>ความคืบหน้าการลงคะแนน</TableCell>
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
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={app.votingProgress || 0}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption">
                      {app.currentVotes || 0}/{app.totalCommitteeMembers || 0} คะแนน
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {app.status === 't.approved' && !app.hasVoted && (
                    <Box>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleVoteAction(app.id, 'approve')}
                        sx={{ mr: 1 }}
                      >
                        เห็นด้วย
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleVoteAction(app.id, 'reject')}
                      >
                        ไม่เห็นด้วย
                      </Button>
                    </Box>
                  )}
                  {app.hasVoted && (
                    <Chip label="ลงคะแนนแล้ว" color="primary" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={voteDialog.open} onClose={() => setVoteDialog({ ...voteDialog, open: false })}>
        <DialogTitle>
          ยืนยันการลงคะแนน: {voteDialog.vote === 'approve' ? 'เห็นด้วย' : 'ไม่เห็นด้วย'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="หมายเหตุ"
            value={voteDialog.remarks}
            onChange={(e) => setVoteDialog({ ...voteDialog, remarks: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoteDialog({ ...voteDialog, open: false })}>
            ยกเลิก
          </Button>
          <Button onClick={handleConfirmVote} variant="contained">
            ยืนยันการลงคะแนน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}