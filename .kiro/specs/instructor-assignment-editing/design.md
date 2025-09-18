# Design Document

## Overview

This design implements an instructor assignment editing system that allows administrators to reassign instructors/advisors for students who are already enrolled in internships. The system integrates with the existing AdonisJS backend and React frontend architecture, leveraging the current `StudentEnrollStatus` model and extending it with instructor reassignment capabilities while maintaining data integrity and audit trails.

## Architecture

### Current System Analysis
- **Backend**: AdonisJS with Lucid ORM, existing `StudentEnrollStatus` model with `instructor_id` foreign key
- **Frontend**: React with TypeScript, existing service pattern with `RemoteA` base class
- **Database**: MySQL with established relationships between `StudentEnrollStatus`, `Instructor`, and `StudentEnroll` models
- **Authentication**: Existing auth system with role-based access control

### Enhanced Architecture
```
Admin Interface → InstructorAssignmentService → Backend API → Database
                                ↓
                        NotificationService → Email/System Notifications
                                ↓
                        AuditTrailService → Change History Tracking
```

## Components and Interfaces

### 1. Backend Enhancements

#### InstructorAssignmentController
```typescript
export default class InstructorAssignmentController {
  // Get current instructor assignment for a student enrollment
  async getCurrentAssignment(ctx: HttpContext): Promise<InstructorAssignmentData>
  
  // Update instructor assignment
  async updateInstructorAssignment(ctx: HttpContext): Promise<void>
  
  // Get available instructors for assignment
  async getAvailableInstructors(ctx: HttpContext): Promise<InstructorOption[]>
  
  // Get assignment history for audit trail
  async getAssignmentHistory(ctx: HttpContext): Promise<AssignmentHistoryEntry[]>
}
```

#### Extended StudentEnrollStatus Model
```typescript
// Add audit trail fields for instructor changes
interface InstructorAssignmentAudit {
  previousInstructorId?: number
  newInstructorId: number
  changedBy: number
  changedAt: DateTime
  reason?: string
  notificationSent: boolean
}

// Extend existing model with assignment change tracking
export default class StudentEnrollStatus extends BaseModel {
  // Existing fields...
  @column()
  declare instructor_id: number
  
  // New audit trail field
  @column({ serialize: (value) => JSON.parse(value || '[]') })
  declare instructor_assignment_history: InstructorAssignmentAudit[]
  
  // Method to change instructor with audit trail
  public async changeInstructor(
    newInstructorId: number, 
    changedBy: number, 
    reason?: string
  ): Promise<void>
}
```

### 2. Frontend Service Layer

#### InstructorAssignmentService
```typescript
export class InstructorAssignmentService extends RemoteA {
  // Get current instructor assignment
  async getCurrentAssignment(studentEnrollId: number): Promise<InstructorAssignmentData>
  
  // Update instructor assignment
  async updateInstructorAssignment(
    studentEnrollId: number, 
    newInstructorId: number, 
    reason?: string
  ): Promise<void>
  
  // Get available instructors for selection
  async getAvailableInstructors(courseId?: number): Promise<InstructorOption[]>
  
  // Get assignment change history
  async getAssignmentHistory(studentEnrollId: number): Promise<AssignmentHistoryEntry[]>
}
```

## Data Models

### Core Data Interfaces

#### InstructorAssignmentData
```typescript
interface InstructorAssignmentData {
  studentEnrollId: number
  studentName: string
  studentCode: string
  currentInstructor: {
    id: number
    name: string
    email: string
    department: string
  }
  courseSection: {
    id: number
    name: string
    code: string
  }
  internshipStatus: string
  canEdit: boolean
  lastChanged?: {
    date: string
    changedBy: string
    reason?: string
  }
}
```

#### InstructorOption
```typescript
interface InstructorOption {
  id: number
  name: string
  email: string
  department: string
  specialization: string[]
  currentWorkload: number
  maxCapacity: number
  isAvailable: boolean
  warningMessage?: string
}
```

#### AssignmentHistoryEntry
```typescript
interface AssignmentHistoryEntry {
  id: number
  previousInstructor?: {
    id: number
    name: string
  }
  newInstructor: {
    id: number
    name: string
  }
  changedBy: {
    id: number
    name: string
  }
  changedAt: string
  reason?: string
  notificationStatus: 'sent' | 'failed' | 'pending'
}
```

### UI Component Structure

#### InstructorAssignmentEditor
```typescript
interface InstructorAssignmentEditorProps {
  studentEnrollId: number
  currentAssignment: InstructorAssignmentData
  onAssignmentChange: (newInstructorId: number, reason?: string) => void
  onCancel: () => void
}

// Main editing component with instructor selection and reason input
const InstructorAssignmentEditor: React.FC<InstructorAssignmentEditorProps>
```

#### InstructorSelector
```typescript
interface InstructorSelectorProps {
  availableInstructors: InstructorOption[]
  selectedInstructorId?: number
  onInstructorSelect: (instructorId: number) => void
  courseId?: number
}

// Dropdown/search component for selecting new instructor
const InstructorSelector: React.FC<InstructorSelectorProps>
```

## Error Handling

### 1. Assignment Validation
- Validate instructor exists and is active
- Check instructor capacity and workload warnings
- Ensure proper permissions for assignment changes
- Prevent assignment to same instructor

### 2. Data Integrity
- Maintain referential integrity during assignment changes
- Handle concurrent assignment updates
- Validate student enrollment status before changes

### 3. Notification Handling
- Retry failed notification deliveries
- Log notification status for audit purposes
- Handle email delivery failures gracefully

## Testing Strategy

### 1. Unit Testing
- Instructor assignment logic
- Data validation functions
- Notification service methods

### 2. Integration Testing
- API integration with backend
- Database transaction integrity
- Email notification delivery

### 3. User Acceptance Testing
- Administrator assignment workflow
- Instructor notification receipt
- Student information updates

## Implementation Approach

### Phase 1: Backend API Development
1. Create `InstructorAssignmentController` with CRUD operations
2. Extend `StudentEnrollStatus` model with assignment history tracking
3. Implement assignment validation and audit trail logic

### Phase 2: Frontend Service Integration
1. Implement `InstructorAssignmentService` extending `RemoteA`
2. Create instructor selection and assignment components
3. Add assignment history display functionality

### Phase 3: UI Integration
1. Integrate assignment editor with existing admin interfaces
2. Add assignment editing to student management pages
3. Implement responsive design for mobile access

### Phase 4: Notification System
1. Implement email notifications for assignment changes
2. Add in-app notifications for affected users
3. Create notification status tracking and retry mechanisms

## API Endpoints

### Backend Routes
```typescript
// Get current assignment
GET /api/v1/instructor-assignment/:studentEnrollId

// Update assignment
PUT /api/v1/instructor-assignment/:studentEnrollId
Body: { newInstructorId: number, reason?: string }

// Get available instructors
GET /api/v1/instructor-assignment/available-instructors?courseId=:courseId

// Get assignment history
GET /api/v1/instructor-assignment/:studentEnrollId/history
```

## Security Considerations

### 1. Authorization
- Only administrators can modify instructor assignments
- Instructors can view their current assignments but not modify
- Students can view their current instructor but not change

### 2. Data Protection
- Log all assignment changes with user identification
- Maintain audit trail for compliance purposes
- Protect sensitive instructor and student information

### 3. Input Validation
- Validate all input parameters
- Sanitize reason text input
- Prevent SQL injection and XSS attacks