# Course Management API Documentation

This document describes the Course Management API endpoints implemented in the Go Fiber backend.

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Course Management Endpoints

### 1. Get Courses
**GET** `/api/v1/courses`

Retrieves a paginated list of courses with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by course code or name
- `curriculum_id` (optional): Filter by curriculum ID

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "curriculum_id": 1,
      "code": "CS101",
      "name": "Introduction to Computer Science",
      "credits": 3,
      "description": "Basic concepts of computer science",
      "prerequisites": "None",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "curriculum": {
        "id": 1,
        "curriculum_name_en": "Computer Science",
        "curriculum_name_th": "วิทยาการคอมพิวเตอร์"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

### 2. Get Course by ID
**GET** `/api/v1/courses/{id}`

Retrieves a specific course by ID.

**Response:**
```json
{
  "data": {
    "id": 1,
    "curriculum_id": 1,
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "credits": 3,
    "description": "Basic concepts of computer science",
    "prerequisites": "None",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "curriculum": {
      "id": 1,
      "curriculum_name_en": "Computer Science",
      "curriculum_name_th": "วิทยาการคอมพิวเตอร์"
    },
    "sections": [
      {
        "id": 1,
        "section": "01",
        "semester": "1",
        "year": 2024
      }
    ]
  }
}
```

### 3. Create Course
**POST** `/api/v1/courses`

Creates a new course.

**Request Body:**
```json
{
  "curriculum_id": 1,
  "code": "CS102",
  "name": "Data Structures",
  "credits": 3,
  "description": "Introduction to data structures and algorithms",
  "prerequisites": "CS101"
}
```

**Response:**
```json
{
  "message": "Course created successfully",
  "data": {
    "id": 2,
    "curriculum_id": 1,
    "code": "CS102",
    "name": "Data Structures",
    "credits": 3,
    "description": "Introduction to data structures and algorithms",
    "prerequisites": "CS101",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Update Course
**PUT** `/api/v1/courses/{id}`

Updates an existing course.

**Request Body:**
```json
{
  "name": "Advanced Data Structures",
  "description": "Advanced concepts in data structures and algorithms",
  "credits": 4
}
```

**Response:**
```json
{
  "message": "Course updated successfully"
}
```

### 5. Delete Course
**DELETE** `/api/v1/courses/{id}`

Deletes a course.

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

## Course Section Management Endpoints

### 1. Get Course Sections
**GET** `/api/v1/course-sections`

Retrieves a paginated list of course sections with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `course_id` (optional): Filter by course ID
- `semester` (optional): Filter by semester (1, 2, 3)
- `year` (optional): Filter by year

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "course_id": 1,
      "section": "01",
      "semester": "1",
      "year": 2024,
      "max_students": 30,
      "schedule": "MWF 10:00-11:00",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "course": {
        "id": 1,
        "code": "CS101",
        "name": "Introduction to Computer Science"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

### 2. Get Course Section by ID
**GET** `/api/v1/course-sections/{id}`

Retrieves a specific course section by ID.

### 3. Create Course Section
**POST** `/api/v1/course-sections`

Creates a new course section.

**Request Body:**
```json
{
  "course_id": 1,
  "section": "02",
  "semester": "2",
  "year": 2024,
  "max_students": 25,
  "schedule": "TTH 14:00-15:30"
}
```

### 4. Update Course Section
**PUT** `/api/v1/course-sections/{id}`

Updates an existing course section.

### 5. Delete Course Section
**DELETE** `/api/v1/course-sections/{id}`

Deletes a course section.

## Instructor Assignment Endpoints

### 1. Assign Instructor to Course
**POST** `/api/v1/courses/assign-instructor`

Assigns an instructor to a course section.

**Request Body:**
```json
{
  "instructor_id": 1,
  "course_section_id": 1,
  "role": "instructor"
}
```

**Valid roles:** `instructor`, `assistant`, `coordinator`

**Response:**
```json
{
  "message": "Instructor assigned to course successfully"
}
```

### 2. Update Instructor Assignment
**PUT** `/api/v1/courses/instructor-assignments/{id}`

Updates an instructor's role in a course section.

**Request Body:**
```json
{
  "role": "coordinator"
}
```

### 3. Remove Instructor from Course
**DELETE** `/api/v1/courses/instructor-assignments/{id}`

Removes an instructor assignment from a course section.

## Committee Management Endpoints

### 1. Assign Committee Member
**POST** `/api/v1/courses/assign-committee`

Assigns an instructor as a committee member to a course section.

**Request Body:**
```json
{
  "instructor_id": 1,
  "course_section_id": 1,
  "role": "member"
}
```

**Valid roles:** `chair`, `member`, `secretary`

### 2. Update Committee Assignment
**PUT** `/api/v1/courses/committee-assignments/{id}`

Updates a committee member's role.

### 3. Remove Committee Member
**DELETE** `/api/v1/courses/committee-assignments/{id}`

Removes a committee member assignment.

## Student Enrollment Status Management

### 1. Update Student Enrollment Status
**PUT** `/api/v1/courses/enrollments/{id}`

Updates a student's enrollment status in a course.

**Request Body:**
```json
{
  "status": "completed",
  "grade": "A",
  "grade_points": 4.0
}
```

**Valid statuses:** `enrolled`, `dropped`, `completed`

### 2. Get Student Enrollment Statuses
**GET** `/api/v1/student-enrollment-statuses`

Retrieves student enrollment statuses with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `student_id` (optional): Filter by student ID
- `semester` (optional): Filter by semester
- `year` (optional): Filter by year

### 3. Create Student Enrollment Status
**POST** `/api/v1/student-enrollment-statuses`

Creates a new student enrollment status record.

**Request Body:**
```json
{
  "student_id": 1,
  "semester": "1",
  "year": 2024,
  "status": "active",
  "gpa": 3.5,
  "credits": 15,
  "instructor_id": 1
}
```

**Valid statuses:** `active`, `inactive`, `graduated`, `dropped`

### 4. Update Student Enrollment Status Record
**PUT** `/api/v1/student-enrollment-statuses/{id}`

Updates an existing student enrollment status record.

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
  "error": "Invalid request body"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Course not found"
}
```

### 409 Conflict
```json
{
  "error": "Course code already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to retrieve courses"
}
```

## Validation Rules

### Course Creation/Update
- `curriculum_id`: Required for creation
- `code`: Required, 3-20 characters, must be unique
- `name`: Required, 3-255 characters
- `credits`: Required, 1-10 credits
- `description`: Optional
- `prerequisites`: Optional

### Course Section Creation/Update
- `course_id`: Required for creation
- `section`: Required, 1-10 characters
- `semester`: Required, must be "1", "2", or "3"
- `year`: Required, 2020-2030
- `max_students`: Optional, 1-200 (default: 30)
- `schedule`: Optional

### Instructor Assignment
- `instructor_id`: Required
- `course_section_id`: Required
- `role`: Required, must be "instructor", "assistant", or "coordinator"

### Committee Assignment
- `instructor_id`: Required
- `course_section_id`: Required
- `role`: Required, must be "chair", "member", or "secretary"

### Enrollment Status
- `status`: Required for enrollment updates
- `grade_points`: Optional, 0-4.0
- `gpa`: Optional, 0-4.0
- `credits`: Optional, minimum 0