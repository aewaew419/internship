# Design Document

## Overview

This feature enhances the existing company evaluation system by adding status tracking and display functionality. The system will show "ประเมินแล้ว" (Evaluated) status when a user has already submitted an evaluation for a company, and redirect users back to the evaluation page after successful submission with appropriate status indication.

The implementation builds upon the existing AdonisJS backend with MySQL database and React frontend with Material-UI components.

## Architecture

### Backend Architecture
- **Framework**: AdonisJS v6 with TypeScript
- **Database**: MySQL with Lucid ORM
- **Authentication**: AdonisJS Auth middleware
- **API Pattern**: RESTful endpoints following existing controller patterns

### Frontend Architecture  
- **Framework**: React 19 with TypeScript
- **Routing**: React Router DOM v7
- **UI Components**: Material-UI v7 with custom styling
- **State Management**: React hooks with custom viewModels
- **HTTP Client**: Axios with base configuration

### Current System Integration
The feature integrates with existing components:
- `StudentEvaluateCompany` model and controller (backend)
- Student evaluation pages and routing (frontend)
- Authentication and authorization system
- Layout and UI component library

## Components and Interfaces

### Backend Components

#### 1. Enhanced StudentEvaluateCompaniesController
**Purpose**: Add status checking endpoint and enhance submission response
**Location**: `backend/app/controllers/student_evaluate_companies_controller.ts`

**New Methods**:
```typescript
// Check if student has evaluated a specific company
public async checkEvaluationStatus({ params, auth }: HttpContext)
// GET /student/evaluate/company/:studentTrainingId/status

// Enhanced update method with redirect response  
public async update({ request, response, auth }: HttpContext)
// PUT /student/evaluate/company/:studentTrainingId (existing endpoint)
```

**Data Flow**:
1. รับ `studentTrainingId` จาก URL parameter (เช่น id=2)
2. ตรวจสอบสิทธิ์: Query `student_trainings` → `student_enrolls` → `student_enroll_statuses`
3. ตรวจสอบว่า `status = 'approve'` หรือไม่ (ถ้าไม่ approve ห้ามประเมิน)
4. Query `student_evaluate_companies` table โดยใช้ `student_training_id = 2`
5. ถ้ามีข้อมูล = ประเมินแล้ว, ถ้าไม่มี = ยังไม่ประเมิน
6. Join กับ `student_trainings` และ `companies` เพื่อดึงชื่อบริษัท

#### 2. StudentEvaluateCompany Model Enhancement
**Purpose**: Add helper methods for status checking
**Location**: `backend/app/models/student_evaluate_company.ts`

**New Methods**:
```typescript
// Static method to check if evaluation exists
static async hasEvaluated(studentTrainingId: number): Promise<boolean>

// Static method to get evaluation with company info
static async getEvaluationWithCompany(studentTrainingId: number): Promise<StudentEvaluateCompany | null>
```

**Existing Relationships** (already defined):
- `belongsTo(() => StudentTraining)` - เชื่อมโยงกับ student_trainings table
- Through StudentTraining: access to Company and StudentEnroll data

### Frontend Components

#### 1. Enhanced StudentEvaluateCompanyPerCompany Component
**Purpose**: Show evaluation status and handle post-submission state
**Location**: `front-end/src/pages/student/evaluate/company/index.tsx`

**Enhancements**:
- Status display when evaluation is completed
- Success message after submission
- Conditional rendering of form vs status

#### 2. Enhanced ViewModel
**Purpose**: Add status checking and improved submission handling
**Location**: `front-end/src/pages/student/evaluate/company/viewModel.ts`

**New Features**:
- Evaluation status checking
- Post-submission navigation
- Success/error state management

#### 3. Status Display Component
**Purpose**: Reusable component for showing evaluation status
**Location**: `front-end/src/component/information/EvaluationStatus.tsx`

**Features**:
- "ประเมินแล้ว" status badge
- Consistent styling with existing design system
- Optional timestamp display

## Data Models

### Database Schema and Relationships
ไม่ต้องสร้าง table ใหม่ ใช้ table ที่มีอยู่แล้ว โดยมีความเชื่อมโยงดังนี้:

```
student_enrolls (การลงทะเบียนของนักศึกษา)
    ↓ (1:many relationship)
student_enroll_statuses (สถานะการลงทะเบียน: approve/denied/pending)
    ↓ 
student_enrolls 
    ↓ (1:1 relationship)
student_trainings (การฝึกงานของนักศึกษา)
    ↓ (1:many relationship)  
student_evaluate_companies (การประเมินบริษัทโดยนักศึกษา)
```

**Table Structure:**
```sql
-- student_evaluate_companies (table หลักที่ใช้)
- id (primary key)
- student_training_id (foreign key → student_trainings.id)
- score (integer) 
- questions (string)
- comment (string)
- created_at (timestamp)
- updated_at (timestamp)

-- student_trainings (เชื่อมโยงกับ company)
- id (primary key)
- student_enroll_id (foreign key → student_enrolls.id)
- company_id (foreign key → companies.id)
- start_date, end_date, coordinator, supervisor, etc.

-- student_enroll_statuses (สถานะการลงทะเบียน)
- id (primary key)
- student_enroll_id (foreign key → student_enrolls.id)
- instructor_id (foreign key → instructors.id)
- status (enum: 'approve', 'denied', 'pending')
- remarks (string)
- created_at, updated_at

-- student_enrolls (การลงทะเบียนของนักศึกษา)
- id (primary key)
- student_id (foreign key → students.id)
- course_section_id (foreign key → course_sections.id)
- grade, attend_training, company_score

-- companies (ข้อมูลบริษัท)
- id (primary key)
- company_name_th (ชื่อบริษัทภาษาไทย)
- company_name_en (ชื่อบริษัทภาษาอังกฤษ)
- company_address, company_email, etc.
```

**Key Relationships:**
- `student_evaluate_companies.student_training_id` → `student_trainings.id`
- `student_trainings.company_id` → `companies.id`
- `student_trainings.student_enroll_id` → `student_enrolls.id`
- `student_enroll_statuses.student_enroll_id` → `student_enrolls.id`

**Business Logic สำหรับ Status:**
- นักศึกษาสามารถประเมินบริษัทได้เฉพาะเมื่อ `student_enroll_statuses.status = 'approve'`
- ต้องมี `student_training` record ที่เชื่อมโยงกับบริษัทก่อนจึงจะประเมินได้

### API Response Models

#### Evaluation Status Response
```typescript
interface EvaluationStatusResponse {
  hasEvaluated: boolean;
  evaluationDate?: string;
  companyName: string;
}
```

#### Enhanced Submission Response
```typescript
interface SubmissionResponse {
  success: boolean;
  message: string;
  redirectUrl: string;
  evaluationId: number;
}
```

## Error Handling

### Backend Error Scenarios
1. **Invalid Company ID**: Return 404 with appropriate error message
2. **Unauthorized Access**: Return 401 for unauthenticated requests
3. **Database Connection Issues**: Return 500 with generic error message
4. **Validation Errors**: Return 422 with field-specific error details

### Frontend Error Scenarios
1. **Network Errors**: Show user-friendly error message with retry option
2. **Invalid URL Parameters**: Redirect to evaluation list page
3. **Submission Failures**: Show error message and allow retry
4. **Loading States**: Show appropriate loading indicators

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
```

## Testing Strategy

### Backend Testing
1. **Unit Tests**: Test controller methods and model functions
   - Status checking logic
   - Submission validation
   - Error handling scenarios

2. **Integration Tests**: Test API endpoints
   - Authentication middleware
   - Database operations
   - Response formatting

### Frontend Testing
1. **Component Tests**: Test React components
   - Status display rendering
   - Form submission handling
   - Error state management

2. **Integration Tests**: Test user workflows
   - Complete evaluation flow
   - Status checking after submission
   - Navigation and routing

### Test Data Requirements
- Test student accounts with various evaluation states
- Test companies with and without evaluations
- Mock API responses for different scenarios

## Implementation Approach

### Phase 1: Backend Status API
1. Add status checking endpoint to existing controller
2. Enhance submission response with redirect information
3. Add validation and error handling
4. Write unit tests for new functionality

### Phase 2: Frontend Status Display
1. Create status display component
2. Enhance existing evaluation page with status checking
3. Update viewModel with status management
4. Add loading and error states

### Phase 3: Integration and Testing
1. Connect frontend to new backend endpoints
2. Test complete user workflow
3. Handle edge cases and error scenarios
4. Performance optimization if needed

### Rollback Strategy
- Feature flags for gradual rollout
- Database migrations are backward compatible
- Frontend changes are additive to existing functionality
- Easy rollback through version control