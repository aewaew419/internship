# Internship Approval Status Transition Validation and Error Handling

This document describes the comprehensive error handling and validation system implemented for the internship approval status transitions, addressing requirements 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, and 6.3.

## Overview

The error handling system provides:
- Frontend validation for status transitions
- Enhanced error classification and user-friendly messages
- Retry mechanisms for failed API calls
- Concurrent update conflict resolution
- Comprehensive error recovery strategies

## Components

### 1. Enhanced Error Handling (`enhanced-error-handling.ts`)

#### Error Classification
- **InternshipErrorType**: Specific error types for internship operations
  - `STATUS_TRANSITION_ERROR`: Invalid status transitions
  - `CONCURRENT_UPDATE_ERROR`: Conflicts from simultaneous updates
  - `COMMITTEE_VOTING_ERROR`: Committee voting issues
  - `ADVISOR_APPROVAL_ERROR`: Advisor approval problems
  - `PERMISSION_ERROR`: Authorization failures

#### Error Messages
- Provides Thai language error messages for better user experience
- Maps technical errors to user-friendly explanations
- Includes context-specific guidance for error resolution

#### API Call Wrapper
```typescript
executeInternshipApiCall<T>(
  apiCall: () => Promise<T>,
  context: {
    operation: string;
    studentEnrollId?: number;
    currentStatus?: InternshipApprovalStatus;
    targetStatus?: InternshipApprovalStatus;
  },
  retryConfig?: Partial<RetryConfig>
): Promise<T>
```

Features:
- Automatic retry with exponential backoff
- Smart retry conditions (doesn't retry permission errors)
- Enhanced error logging with context
- Concurrent update detection

### 2. Enhanced Service (`EnhancedInternshipApprovalService.ts`)

Extends the base `InternshipApprovalService` with:
- Comprehensive error handling for all operations
- Conflict resolution strategies
- Client-side validation before API calls
- Unified status transition validation

#### Conflict Resolution Strategies
- **abort**: Cancel the operation
- **overwrite**: Force the change, overwriting conflicts
- **user_choice**: Let the user decide through UI

### 3. Status Transition Handler Hook (`useStatusTransitionHandler.ts`)

React hook providing:
- State management for transitions
- Error handling with user feedback
- Conflict resolution UI integration
- Retry mechanisms

#### State Management
```typescript
interface StatusTransitionState {
  isLoading: boolean;
  error: string | null;
  isConflictDialogOpen: boolean;
  conflictData: any;
  lastAttemptedTransition: TransitionData | null;
}
```

#### Methods
- `executeTransition()`: Execute status change with validation
- `retryLastTransition()`: Retry failed operations
- `resolveConflict()`: Handle concurrent update conflicts
- `clearError()`: Reset error state
- `dismissConflictDialog()`: Close conflict resolution UI

### 4. Conflict Resolution Dialog (`ConflictResolutionDialog.tsx`)

React component for handling concurrent update conflicts:
- Displays conflict information clearly
- Shows what changed and when
- Provides resolution options
- Supports Thai language interface

Features:
- Visual comparison of conflicting states
- Timestamp information
- User-friendly resolution choices
- Loading states during resolution

### 5. Enhanced Status Display (`ApprovalStatusDisplay.tsx`)

Updated component with integrated error handling:
- Real-time conflict detection
- Error message display
- Retry functionality
- Success notifications

## Usage Examples

### Basic Status Transition
```typescript
const statusHandler = useStatusTransitionHandler();

// Execute a transition
await statusHandler.executeTransition(
  studentEnrollId,
  'registered',
  't.approved',
  'advisor',
  { remarks: 'Application approved' }
);
```

### Handling Conflicts
```typescript
// The hook automatically detects conflicts and opens the dialog
// User can choose resolution strategy through UI

// Programmatic conflict resolution
await statusHandler.resolveConflict({ type: 'overwrite' });
```

### Error Recovery
```typescript
// Retry failed operations
if (statusHandler.error && statusHandler.lastAttemptedTransition) {
  await statusHandler.retryLastTransition();
}
```

## Validation Rules

### Status Transition Matrix
```
registered -> [t.approved, doc.approved]  // Advisor can approve/reject
t.approved -> [c.approved, doc.approved]  // Committee can approve/reject
c.approved -> [doc.cancel]               // Admin can cancel
doc.approved -> []                       // Final state
doc.cancel -> []                         // Final state
```

### Role-Based Permissions
- **Advisor**: Can approve/reject `registered` applications
- **Committee Member**: Can approve/reject `t.approved` applications
- **Admin**: Can perform any valid transition
- **Student**: Cannot directly change status

### Business Rules
- Committee approval requires ≥50% approval rate
- Cannot reject when committee approval ≥50%
- Certain transitions require confirmation dialogs

## Error Handling Strategies

### Network Errors
- Automatic retry with exponential backoff
- Maximum 3 retry attempts
- User notification with retry option

### Permission Errors
- No retry (immediate failure)
- Clear error message
- Guidance for resolution

### Validation Errors
- Client-side validation before API calls
- Server-side validation as backup
- Detailed error messages

### Concurrent Updates
- Conflict detection through timestamps
- User choice for resolution
- Data integrity protection

## Testing

### Unit Tests
- Error classification logic
- Status transition validation
- Conflict resolution strategies
- Hook state management

### Integration Tests
- API error handling
- UI error display
- Conflict resolution flow
- Retry mechanisms

### User Acceptance Tests
- Error message clarity
- Recovery process usability
- Conflict resolution UX

## Configuration

### Retry Configuration
```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};
```

### Error Message Localization
All error messages are provided in Thai for better user experience:
- Status transition errors
- Permission errors
- Network errors
- Conflict resolution messages

## Best Practices

1. **Always use the enhanced service** instead of the base service
2. **Implement proper error boundaries** in React components
3. **Provide clear user feedback** for all error states
4. **Test error scenarios** thoroughly
5. **Log errors appropriately** for debugging
6. **Handle offline scenarios** gracefully
7. **Validate on both client and server** sides

## Future Enhancements

1. **Offline support** with local storage
2. **Real-time notifications** for status changes
3. **Audit trail** for all transitions
4. **Advanced conflict resolution** with merge strategies
5. **Performance monitoring** for error rates
6. **A/B testing** for error message effectiveness

## Troubleshooting

### Common Issues

1. **Concurrent Update Conflicts**
   - Cause: Multiple users modifying same record
   - Solution: Use conflict resolution dialog
   - Prevention: Real-time status updates

2. **Permission Errors**
   - Cause: User role doesn't allow transition
   - Solution: Check user permissions
   - Prevention: Hide unavailable actions

3. **Network Timeouts**
   - Cause: Slow network or server issues
   - Solution: Automatic retry mechanism
   - Prevention: Optimize API performance

4. **Validation Failures**
   - Cause: Invalid status transitions
   - Solution: Client-side validation
   - Prevention: UI state management

### Debug Information

Enable debug logging by setting:
```typescript
process.env.NODE_ENV = 'development';
```

This will log detailed error information to the console for troubleshooting.