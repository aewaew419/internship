# Requirements Document

## Introduction

This feature implements a company evaluation system where users can submit evaluations for companies and see the evaluation status updated on the evaluation page. After submitting an evaluation, users should be redirected back to the evaluation page with a clear indication that the evaluation has been completed.

## Requirements

### Requirement 1

**User Story:** As a user, I want to submit a company evaluation, so that I can provide feedback about the company and track that I have completed the evaluation.

#### Acceptance Criteria

1. WHEN a user submits a company evaluation THEN the system SHALL save the evaluation data to the database
2. WHEN a user submits a company evaluation THEN the system SHALL redirect the user back to the company evaluation page
3. WHEN a user submits a company evaluation THEN the system SHALL display a success message confirming the submission

### Requirement 2

**User Story:** As a user, I want to see the evaluation status on the company page, so that I can quickly identify which companies I have already evaluated.

#### Acceptance Criteria

1. WHEN a user visits a company evaluation page AND they have already submitted an evaluation THEN the system SHALL display "ประเมินแล้ว" (Evaluated) status
2. WHEN a user visits a company evaluation page AND they have not submitted an evaluation THEN the system SHALL show the evaluation form
3. WHEN the evaluation status is displayed THEN it SHALL be clearly visible and distinguishable from other page elements

### Requirement 3

**User Story:** As a user, I want the evaluation status to persist across sessions, so that I don't lose track of which companies I have evaluated.

#### Acceptance Criteria

1. WHEN a user logs out and logs back in THEN the system SHALL maintain the evaluation status for previously evaluated companies
2. WHEN a user accesses the company evaluation page from different devices THEN the system SHALL show consistent evaluation status
3. WHEN evaluation data is stored THEN it SHALL include user identification and company identification for proper tracking

### Requirement 4

**User Story:** As a user, I want to navigate to the company evaluation page using a URL with company ID, so that I can directly access specific company evaluations.

#### Acceptance Criteria

1. WHEN a user accesses the URL "company_evaluation/company?id=2" THEN the system SHALL load the evaluation page for company with ID 2
2. WHEN a company ID is provided in the URL THEN the system SHALL validate that the company exists
3. IF a company ID does not exist THEN the system SHALL display an appropriate error message