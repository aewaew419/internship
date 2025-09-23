# Student Management API Documentation

This document describes the student management endpoints implemented in the Go Fiber backend.

## Overview

The student management system provides comprehensive CRUD operations for managing students, their profiles, and enrollment information. All endpoints require authentication via JWT token.

## Base URL

All endpoints are prefixed with `/api/v1/students`

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Students List

**GET** `/api/v1/students`

Retrieves a paginated list of students with optional search and filtering.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `limit` | integer | Items per page (max 100) | 10 |
| `search` | string | Search by name, surname, student_id, or email | - |
| `major_id` | integer | Filter by major ID | - |
| `program_id` | integer | Filter by program ID | - |
| `faculty_id` | integer | Filter by faculty ID | - |
| `campus_id` | integer | Filter by campus ID | - |
| `sort_by` | string | Sort field (id, name, surname, student_id, gpax, created_at, updated_at) | created_at |
| `sort_desc` | boolean | Sort in descending order | false |

#### Response

```json
{
  "message": "Students retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "user_id": 1,
        "name": "John",
        "middle_name": "",
        "surname": "Doe",
        "student_id": "STU001",
        "gpax": 3.5,
        "phone_number": "1234567890",
        "email": "john@example.com",
        "picture": "",
        "major_id": 1,
        "program_id": 1,
        "curriculum_id": 1,
        "faculty_id": 1,
        "campus_id": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "user": { ... },
        "major": { ... },
        "program": { ... },
        "curriculum": { ... },
        "faculty": { ... },
        "campus": { ... }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

### 2. Get Student by ID

**GET** `/api/v1/students/{id}`

Retrieves a single student by ID with all related information.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Student ID |

#### Response

```json
{
  "message": "Student retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "John",
    "middle_name": "",
    "surname": "Doe",
    "student_id": "STU001",
    "gpax": 3.5,
    "phone_number": "1234567890",
    "email": "john@example.com",
    "picture": "",
    "major_id": 1,
    "program_id": 1,
    "curriculum_id": 1,
    "faculty_id": 1,
    "campus_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "user": { ... },
    "major": { ... },
    "program": { ... },
    "curriculum": { ... },
    "faculty": { ... },
    "campus": { ... },
    "student_enrolls": [ ... ]
  }
}
```

### 3. Create Student

**POST** `/api/v1/students`

Creates a new student record.

#### Request Body

```json
{
  "user_id": 1,
  "name": "John",
  "middle_name": "",
  "surname": "Doe",
  "student_id": "STU001",
  "gpax": 3.5,
  "phone_number": "1234567890",
  "email": "john@example.com",
  "picture": "",
  "major_id": 1,
  "program_id": 1,
  "curriculum_id": 1,
  "faculty_id": 1,
  "campus_id": 1
}
```

#### Required Fields

- `user_id`: Must reference an existing user
- `name`: Student's first name
- `surname`: Student's last name
- `student_id`: Unique student identifier
- `campus_id`: Must reference an existing campus

#### Response

```json
{
  "message": "Student created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "John",
    "surname": "Doe",
    "student_id": "STU001",
    // ... other fields
  }
}
```

### 4. Update Student

**PUT** `/api/v1/students/{id}`

Updates an existing student record.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Student ID |

#### Request Body

All fields are optional. Only provided fields will be updated.

```json
{
  "name": "Jane",
  "middle_name": "Marie",
  "surname": "Smith",
  "student_id": "STU002",
  "gpax": 3.8,
  "phone_number": "0987654321",
  "email": "jane@example.com",
  "picture": "profile.jpg",
  "major_id": 2,
  "program_id": 2,
  "curriculum_id": 2,
  "faculty_id": 2,
  "campus_id": 2
}
```

#### Response

```json
{
  "message": "Student updated successfully",
  "data": {
    "id": 1,
    "name": "Jane",
    "surname": "Smith",
    // ... updated fields
  }
}
```

### 5. Delete Student

**DELETE** `/api/v1/students/{id}`

Deletes a student record and all related enrollments.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Student ID |

#### Response

```json
{
  "message": "Student deleted successfully"
}
```

### 6. Enroll Student

**POST** `/api/v1/students/enroll`

Enrolls a student in a course section.

#### Request Body

```json
{
  "student_id": 1,
  "course_section_id": 1,
  "status": "enrolled"
}
```

#### Required Fields

- `student_id`: Must reference an existing student
- `course_section_id`: Must reference an existing course section

#### Optional Fields

- `status`: Enrollment status (default: "enrolled")

#### Response

```json
{
  "message": "Student enrolled successfully",
  "data": {
    "id": 1,
    "student_id": 1,
    "course_section_id": 1,
    "enroll_date": "2024-01-01T00:00:00Z",
    "status": "enrolled",
    "grade": null,
    "grade_points": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "student": { ... },
    "course_section": { ... }
  }
}
```

### 7. Update Enrollment

**PUT** `/api/v1/students/enrollments/{id}`

Updates a student enrollment record.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Enrollment ID |

#### Request Body

All fields are optional.

```json
{
  "status": "completed",
  "grade": "A",
  "grade_points": 4.0
}
```

#### Response

```json
{
  "message": "Enrollment updated successfully",
  "data": {
    "id": 1,
    "status": "completed",
    "grade": "A",
    "grade_points": 4.0,
    // ... other fields
  }
}
```

### 8. Get Student Enrollments

**GET** `/api/v1/students/{id}/enrollments`

Retrieves all enrollments for a specific student.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Student ID |

#### Response

```json
{
  "message": "Student enrollments retrieved successfully",
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "course_section_id": 1,
      "enroll_date": "2024-01-01T00:00:00Z",
      "status": "enrolled",
      "grade": "A",
      "grade_points": 4.0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "course_section": {
        "id": 1,
        "course": {
          "id": 1,
          "code": "CS101",
          "name": "Introduction to Computer Science",
          "credits": 3
        }
      }
    }
  ]
}
```

### 9. Get Student Statistics

**GET** `/api/v1/students/stats`

Retrieves statistical information about students.

#### Response

```json
{
  "message": "Student statistics retrieved successfully",
  "data": {
    "total_students": 150,
    "by_major": [
      {
        "major_id": 1,
        "major_name": "Computer Science",
        "count": 50
      },
      {
        "major_id": 2,
        "major_name": "Information Technology",
        "count": 30
      }
    ],
    "by_faculty": [
      {
        "faculty_id": 1,
        "faculty_name": "Engineering",
        "count": 80
      },
      {
        "faculty_id": 2,
        "faculty_name": "Science",
        "count": 70
      }
    ]
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid request body",
  "code": "INVALID_REQUEST_BODY"
}
```

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": "Field validation error details"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### 404 Not Found

```json
{
  "error": "Student not found",
  "code": "STUDENT_NOT_FOUND"
}
```

### 409 Conflict

```json
{
  "error": "Student with this student ID already exists",
  "code": "STUDENT_ID_EXISTS"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch students",
  "code": "FETCH_STUDENTS_ERROR"
}
```

## Business Rules

1. **Student ID Uniqueness**: Each student must have a unique student_id across the system.

2. **User Association**: Each student must be associated with exactly one user account. A user can only be associated with one student record.

3. **Campus Requirement**: Every student must be assigned to a campus.

4. **Optional Relationships**: Major, Program, Curriculum, and Faculty associations are optional but recommended for proper academic tracking.

5. **Enrollment Rules**: 
   - A student can only be enrolled once in the same course section
   - Enrollment status can be: "enrolled", "dropped", "completed"
   - Grades can only be assigned to completed enrollments

6. **Cascade Deletion**: When a student is deleted, all their enrollment records are also deleted.

7. **Data Validation**:
   - Email addresses must be valid format
   - GPAX must be between 0.0 and 4.0
   - Grade points must be between 0.0 and 4.0

## Usage Examples

### Search for students by name

```bash
curl -X GET "http://localhost:8080/api/v1/students?search=John" \
  -H "Authorization: Bearer <jwt_token>"
```

### Filter students by major and sort by GPAX

```bash
curl -X GET "http://localhost:8080/api/v1/students?major_id=1&sort_by=gpax&sort_desc=true" \
  -H "Authorization: Bearer <jwt_token>"
```

### Create a new student

```bash
curl -X POST "http://localhost:8080/api/v1/students" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "John",
    "surname": "Doe",
    "student_id": "STU001",
    "campus_id": 1
  }'
```

### Enroll student in a course

```bash
curl -X POST "http://localhost:8080/api/v1/students/enroll" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "course_section_id": 1,
    "status": "enrolled"
  }'
```

This API provides comprehensive student management functionality with proper validation, error handling, and relationship management.