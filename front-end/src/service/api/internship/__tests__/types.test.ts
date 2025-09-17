// Tests for Internship Approval Types and Interfaces
// Verifying type definitions and configuration

import { describe, it, expect } from 'vitest';
import {
  InternshipApprovalStatus,
  ApprovalStatusData,
  CommitteeVote,
  StatusTransition,
  CommitteeVotingData,
  STATUS_DISPLAY_CONFIG,
  getStatusDisplayConfig,
  getStatusText,
  getStatusColor,
  getStatusIcon
} from '../index';

describe('Internship Approval Types', () => {
  it('should define all required status values', () => {
    const expectedStatuses: InternshipApprovalStatus[] = [
      'registered',
      't.approved',
      'c.approved',
      'doc.approved',
      'doc.cancel'
    ];

    expectedStatuses.forEach(status => {
      expect(STATUS_DISPLAY_CONFIG[status]).toBeDefined();
    });
  });

  it('should have correct Thai text for each status', () => {
    expect(getStatusText('registered')).toBe('อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา');
    expect(getStatusText('t.approved')).toBe('อยู่ระหว่างการพิจารณา โดยคณะกรรมการ');
    expect(getStatusText('c.approved')).toBe('อนุมัติเอกสารขอฝึกงาน / สหกิจ');
    expect(getStatusText('doc.approved')).toBe('ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ');
    expect(getStatusText('doc.cancel')).toBe('ยกเลิกการฝึกงาน/สหกิจ');
  });

  it('should have appropriate colors for each status', () => {
    expect(getStatusColor('registered')).toBe('#FFA500'); // Orange
    expect(getStatusColor('t.approved')).toBe('#2196F3'); // Blue
    expect(getStatusColor('c.approved')).toBe('#4CAF50'); // Green
    expect(getStatusColor('doc.approved')).toBe('#F44336'); // Red
    expect(getStatusColor('doc.cancel')).toBe('#9E9E9E'); // Gray
  });

  it('should have appropriate icons for each status', () => {
    expect(getStatusIcon('registered')).toBe('pending');
    expect(getStatusIcon('t.approved')).toBe('committee');
    expect(getStatusIcon('c.approved')).toBe('approved');
    expect(getStatusIcon('doc.approved')).toBe('rejected');
    expect(getStatusIcon('doc.cancel')).toBe('cancelled');
  });

  it('should create valid ApprovalStatusData interface', () => {
    const mockApprovalData: ApprovalStatusData = {
      studentEnrollId: 1,
      currentStatus: 'registered',
      statusText: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
      statusUpdatedAt: '2024-01-01T00:00:00Z',
      committeeVotes: [],
      approvalPercentage: 0,
      statusHistory: []
    };

    expect(mockApprovalData.studentEnrollId).toBe(1);
    expect(mockApprovalData.currentStatus).toBe('registered');
    expect(mockApprovalData.committeeVotes).toEqual([]);
  });

  it('should create valid CommitteeVote interface', () => {
    const mockVote: CommitteeVote = {
      instructorId: 1,
      vote: 'approve',
      votedAt: '2024-01-01T00:00:00Z',
      remarks: 'Test remarks'
    };

    expect(mockVote.instructorId).toBe(1);
    expect(mockVote.vote).toBe('approve');
    expect(mockVote.remarks).toBe('Test remarks');
  });

  it('should create valid StatusTransition interface', () => {
    const mockTransition: StatusTransition = {
      fromStatus: 'registered',
      toStatus: 't.approved',
      changedBy: 1,
      changedAt: '2024-01-01T00:00:00Z',
      reason: 'Advisor approved'
    };

    expect(mockTransition.fromStatus).toBe('registered');
    expect(mockTransition.toStatus).toBe('t.approved');
    expect(mockTransition.changedBy).toBe(1);
  });

  it('should create valid CommitteeVotingData interface', () => {
    const mockVotingData: CommitteeVotingData = {
      studentEnrollId: 1,
      totalCommitteeMembers: 5,
      currentVotes: [],
      approvalPercentage: 0,
      votingComplete: false
    };

    expect(mockVotingData.studentEnrollId).toBe(1);
    expect(mockVotingData.totalCommitteeMembers).toBe(5);
    expect(mockVotingData.votingComplete).toBe(false);
  });
});