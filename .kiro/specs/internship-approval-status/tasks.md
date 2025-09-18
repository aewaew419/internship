# Implementation Plan

- [x] 1. Create internship approval status types and interfaces

  - Define TypeScript interfaces for InternshipApprovalStatus enum with exact status codes
  - Create ApprovalStatusData interface for API responses
  - Implement StatusDisplayConfig with exact Thai text and UI styling
  - Write CommitteeVote and StatusTransition interfaces
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [x] 2. Extend backend StudentEnrollStatus model for internship approval workflow

  - Add new status values to existing status enum in StudentEnrollStatus model
  - Create database migration to support new status values
  - Add committee voting tracking fields to model
  - Implement status transition validation methods
  - Write unit tests for model extensions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.3_

- [x] 3. Create InternshipApprovalController with core API endpoints

  - Implement getApprovalStatus endpoint to retrieve current status
  - Create advisorApproval endpoint for advisor approve/reject actions
  - Add committeeMemberVote endpoint for committee voting
  - Implement updateApprovalStatus for administrative changes
  - Write controller unit tests for all endpoints
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1_

- [x] 4. Implement committee voting calculation logic

  - Create service class for committee vote counting
  - Implement 50% approval threshold calculation
  - Add automatic status transition when voting completes
  - Create vote validation to prevent duplicate voting
  - Write comprehensive tests for voting logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.4_

- [x] 5. Create frontend InternshipApprovalService API integration

  - Implement InternshipApprovalService class extending RemoteA
  - Add getApprovalStatus method with proper error handling
  - Create submitAdvisorApproval method for advisor actions
  - Implement submitCommitteeVote method for committee members
  - Write service unit tests with mocked API responses
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 6.1, 6.2, 6.3_

- [x] 6. Build ApprovalStatusViewModel for status display management

  - Create useApprovalStatusViewModel hook with state management
  - Implement fetchApprovalStatus method using InternshipApprovalService
  - Add status text formatting using StatusDisplayConfig
  - Create real-time status refresh functionality
  - Write ViewModel unit tests with proper mocking
  - _Requirements: 1.1, 1.2, 1.3, 5.3, 6.4_

- [x] 7. Create ApprovalStatusDisplay component with exact UI specifications

  - Build React component for displaying approval status
  - Implement exact Thai text display matching UI requirements
  - Add appropriate status colors and icons from design
  - Create loading and error states for status display
  - Write component tests for all status variations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3_

- [x] 8. Implement AdvisorApprovalInterface for advisor workflow

  - Create advisor dashboard component for pending applications
  - Add approve/reject buttons with confirmation dialogs
  - Implement remarks input for approval decisions
  - Create filtering and search for advisor applications
  - Write integration tests for advisor approval workflow
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9. Build CommitteeVotingInterface for committee member workflow

  - Create committee voting dashboard component
  - Implement voting buttons with vote confirmation
  - Add voting progress display showing current vote count
  - Create committee member vote history view
  - Write tests for committee voting interface
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 10. Add status transition validation and error handling

  - Implement frontend validation for status transitions
  - Create error handling for invalid status changes
  - Add retry mechanisms for failed API calls
  - Implement concurrent update conflict resolution
  - Write comprehensive error handling tests
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3_

- [x] 11. Create administrative tools for status management

  - Build admin interface for manual status changes
  - Implement cancellation functionality for approved internships
  - Add Pass/Failed outcome tracking for completed internships
  - Create status history audit trail display
  - Write tests for administrative functions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 12. Integrate approval status display with existing UI components

  - Update existing student views to show approval status
  - Integrate status display into supervision schedule pages
  - Add status indicators to student lists and reports
  - Ensure consistent styling with existing UI design

  - Write integration tests for UI consistency
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 13. Write comprehensive end-to-end tests for approval workflow





  - Create E2E tests for complete advisor approval process
  - Test full committee voting workflow from start to finish
  - Verify status transitions and display accuracy
  - Test concurrent user scenarios and data consistency
  - Validate exact Thai text display matches requirements
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_
