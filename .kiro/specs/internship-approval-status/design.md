# Design Document

## Overview

This design implements a comprehensive internship approval status tracking system that integrates with the existing AdonisJS backend and React frontend architecture. The system leverages the current `StudentEnrollStatus` model and extends it to support the specific internship approval workflow with proper status transitions, committee voting mechanisms, and real-time status updates.

## Architecture

### Current System Analysis
- **Backend**: AdonisJS with Lucid ORM, existing `StudentEnrollStatus` model with approval workflow
- **Frontend**: React with TypeScript, existing `VisitorService` for API communication
- **Database**: MySQL with established relationships between students, instructors, and course committees
- **Authentication**: Existing auth system with role-based access control

### Enhanced Architecture
```
Frontend Components → ViewModels → ApprovalService → Backend API → Database
                                      ↓
                              StatusTracker → Real-time Updates
```

## Components and Interfaces

### 1. Backend Enhancements

#### Extended StudentEnrollStatus Model
```typescript
// Enhanced status enum to support internship approval workflow
export type InternshipApprovalStatus = 
  | 'registered'        // Initial application
  | 't.approved'        // Advisor approved
  | 'c.approved'        // Committee approved
  | 'doc.approved'      // Rejected (confusing naming from legacy system)
  | 'doc.cancel'        // Cancelled after approval

// Additional fields for approval tracking
interface InternshipStatusExtension {
  advisorApprovalDate?: DateTime
  committeeVotes: CommitteeVote[]
  approvalPercentage: number
  finalOutcome?: 'Pass' | 'Failed'
  statusHistory: StatusTransition[]
}
```

#### Committee Voting System
```typescript
interface CommitteeVote {
  instructorId: number
  vote: 'approve' | 'reject'
  votedAt: DateTime
  remarks?: string
}

interface StatusTransition {
  fromStatus: InternshipApprovalStatus
  toStatus: InternshipApprovalStatus
  changedBy: number
  changedAt: DateTime
  reason?: string
}
```

### 2. Frontend Service Layer

#### InternshipApprovalService
```typescript
class InternshipApprovalService extends RemoteA {
  // Get current approval status
  async getApprovalStatus(studentEnrollId: number): Promise<ApprovalStatusData>
  
  // Submit advisor approval
  async submitAdvisorApproval(studentEnrollId: number, approved: boolean): Promise<void>
  
  // Submit committee vote
  async submitCommitteeVote(studentEnrollId: number, vote: 'approve' | 'reject'): Promise<void>
  
  // Get committee voting status
  async getCommitteeVotingStatus(studentEnrollId: number): Promise<CommitteeVotingData>
}
```

## Data Models

### Core Data Interfaces

#### ApprovalStatusData
```typescript
interface ApprovalStatusData {
  studentEnrollId: number
  currentStatus: InternshipApprovalStatus
  statusText: string
  statusUpdatedAt: string
  
  // Advisor approval info
  advisorId?: number
  advisorApprovalDate?: string
  
  // Committee voting info
  committeeVotes: CommitteeVote[]
  approvalPercentage: number
  
  // Final outcome
  finalOutcome?: 'Pass' | 'Failed'
}
```

### Status Display Configuration

#### StatusDisplayConfig
```typescript
const STATUS_CONFIG = {
  'registered': {
    text: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
    color: '#FFA500',
    icon: 'pending'
  },
  't.approved': {
    text: 'อยู่ระหว่างการพิจารณา โดยคณะกรรมการ',
    color: '#2196F3',
    icon: 'committee'
  },
  'c.approved': {
    text: 'อนุมัติเอกสารขอฝึกงาน / สหกิจ',
    color: '#4CAF50',
    icon: 'approved'
  },
  'doc.approved': {
    text: 'ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ',
    color: '#F44336',
    icon: 'rejected'
  },
  'doc.cancel': {
    text: 'ยกเลิกการฝึกงาน/สหกิจ',
    color: '#9E9E9E',
    icon: 'cancelled'
  }
}
```

## Error Handling

### 1. Status Transition Validation
- Validate status transitions follow proper workflow
- Prevent invalid status changes
- Handle concurrent status updates

### 2. Committee Voting Validation
- Ensure only committee members can vote
- Prevent duplicate voting
- Validate voting permissions

### 3. API Error Handling
- Network connectivity issues
- Authentication/authorization errors
- Data validation errors

## Testing Strategy

### 1. Unit Testing
- Status transition logic
- Committee voting calculations
- Data transformation functions

### 2. Integration Testing
- API integration with backend
- Database transaction integrity
- Real-time status updates

### 3. User Acceptance Testing
- Advisor approval workflow
- Committee voting process
- Student status viewing

## Implementation Approach

### Phase 1: Core Status Management
1. Extend `StudentEnrollStatus` model with internship-specific fields
2. Create `InternshipApprovalController` with basic operations
3. Implement `InternshipApprovalService` frontend service

### Phase 2: Advisor Approval System
1. Implement advisor approval interface
2. Add advisor approval API endpoints
3. Create advisor dashboard

### Phase 3: Committee Voting System
1. Implement committee voting interface
2. Add voting calculation logic
3. Create committee dashboard

### Phase 4: Status Display Integration
1. Create status display components
2. Integrate with existing UI
3. Add real-time updates