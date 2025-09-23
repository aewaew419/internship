# User Management API Documentation

This document describes the user management endpoints implemented in the Go Fiber backend.

## Authentication

All user management endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. List Users
**GET** `/api/v1/users`

Retrieves a paginated list of users with optional search and filtering.

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `limit` (int, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search term for full name or email
- `role_id` (int, optional): Filter by role ID
- `sort_by` (string, optional): Sort field (id, full_name, email, role_id, created_at, updated_at)
- `sort_desc` (boolean, optional): Sort in descending order (default: false)

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com",
        "role_id": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "role": {
          "id": 1,
          "name": "student"
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "total_pages": 10
  }
}
```

### 2. Get User by ID
**GET** `/api/v1/users/:id`

Retrieves a single user by ID with related data.

**Response:**
```json
{
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "role": {
      "id": 1,
      "name": "student"
    },
    "student": {
      "id": 1,
      "student_id": "STU001"
    }
  }
}
```

### 3. Create User
**POST** `/api/v1/users`

Creates a new user.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role_id": 1
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "role": {
      "id": 1,
      "name": "student"
    }
  }
}
```

### 4. Update User
**PUT** `/api/v1/users/:id`

Updates an existing user.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "email": "john.smith@example.com",
  "role_id": 2
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "full_name": "John Smith",
    "email": "john.smith@example.com",
    "role_id": 2,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "role": {
      "id": 2,
      "name": "instructor"
    }
  }
}
```

### 5. Delete User
**DELETE** `/api/v1/users/:id`

Deletes a user by ID. Users cannot delete their own account.

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### 6. Bulk Delete Users
**DELETE** `/api/v1/users/bulk`

Deletes multiple users by their IDs.

**Request Body:**
```json
{
  "user_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "message": "Users deleted successfully"
}
```

### 7. Bulk Create from Excel
**POST** `/api/v1/users/bulk-excel`

Creates multiple users from an Excel file upload.

**Request:** Multipart form data
- `file`: Excel file (.xlsx)
- `role_id`: Role ID to assign to all users

**Excel File Format:**
The Excel file should have the following columns in the first row (header):
- `full_name` or `name`: User's full name
- `email`: User's email address
- `password`: User's password (optional, defaults to "password123")

**Response:**
```json
{
  "message": "Excel file processed successfully",
  "created_users": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "role_id": 1
    }
  ],
  "created_count": 1,
  "errors": [
    "Row 3: user with email jane@example.com already exists"
  ],
  "error_count": 1
}
```

### 8. Get User Statistics
**GET** `/api/v1/users/stats`

Retrieves user statistics including total count and breakdown by role.

**Response:**
```json
{
  "message": "User statistics retrieved successfully",
  "data": {
    "total_users": 150,
    "by_role": [
      {
        "role_id": 1,
        "role_name": "student",
        "count": 120
      },
      {
        "role_id": 2,
        "role_name": "instructor",
        "count": 25
      },
      {
        "role_id": 3,
        "role_name": "admin",
        "count": 5
      }
    ]
  }
}
```

## Error Responses

All endpoints return structured error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes:
- `INVALID_REQUEST_BODY`: Request body is malformed
- `VALIDATION_ERROR`: Request validation failed
- `USER_NOT_FOUND`: User with specified ID not found
- `EMAIL_EXISTS`: User with email already exists
- `INVALID_ROLE`: Specified role ID is invalid
- `CANNOT_DELETE_SELF`: User cannot delete their own account
- `AUTH_REQUIRED`: Authentication token required
- `INVALID_USER_ID`: User ID parameter is invalid

## Usage Examples

### Create a new user
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com", 
    "password": "password123",
    "role_id": 1
  }'
```

### Get users with pagination and search
```bash
curl "http://localhost:8080/api/v1/users?page=1&limit=20&search=john&role_id=1" \
  -H "Authorization: Bearer <token>"
```

### Bulk upload users from Excel
```bash
curl -X POST http://localhost:8080/api/v1/users/bulk-excel \
  -H "Authorization: Bearer <token>" \
  -F "file=@users.xlsx" \
  -F "role_id=1"
```

### Delete multiple users
```bash
curl -X DELETE http://localhost:8080/api/v1/users/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"user_ids": [1, 2, 3]}'
```