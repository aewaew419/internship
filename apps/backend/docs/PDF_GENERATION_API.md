# PDF Generation API Documentation

This document describes the PDF generation functionality implemented in the Go Fiber backend.

## Overview

The PDF generation service provides functionality to create various types of reports and letters in PDF format. It supports both Thai and English languages and includes templates for common internship-related documents.

## Features

### Report Types
- **Student List Report**: Generate reports listing students with their details
- **Internship Summary Report**: Generate summaries of student internship trainings
- **Visitor Schedule Report**: Generate reports of visitor schedules and visits
- **Company Evaluation Report**: Generate reports listing companies and their details

### Letter Types
- **Cooperative Education Request Letter**: Request letters to companies for student internships
- **Referral Letter**: Letters referring students to companies
- **Recommendation Letter**: Letters recommending students for internships
- **Acceptance Letter**: Letters confirming internship acceptance

## API Endpoints

### Generate Report
```
POST /api/v1/pdf/reports
```

**Request Body:**
```json
{
  "report_type": "student_list|internship_summary|visitor_schedule|company_evaluation",
  "title": "Report Title",
  "student_ids": [1, 2, 3],
  "company_ids": [1, 2],
  "training_ids": [1, 2],
  "schedule_ids": [1, 2],
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "Report generated successfully",
  "filename": "student_list_20240923_140530.pdf",
  "download_url": "/api/v1/pdf/download/student_list_20240923_140530.pdf"
}
```

### Generate Letter
```
POST /api/v1/pdf/letters
```

**Request Body:**
```json
{
  "letter_type": "coop_request|referral|recommendation|acceptance",
  "student_id": 1,
  "training_id": 1,
  "instructor_id": 1,
  "recipient": "HR Manager",
  "subject": "Letter Subject",
  "content": "Additional content",
  "language": "th|en"
}
```

**Response:**
```json
{
  "message": "Letter generated successfully",
  "filename": "coop_request_65130001_20240923_140530.pdf",
  "download_url": "/api/v1/pdf/download/coop_request_65130001_20240923_140530.pdf"
}
```

### Download PDF
```
GET /api/v1/pdf/download/:filename
```

**Response:** PDF file download

### List PDFs
```
GET /api/v1/pdf/list?page=1&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "filename": "report_20240923_140530.pdf",
      "size": 12345,
      "modified_at": "2024-09-23T14:05:30Z",
      "download_url": "/api/v1/pdf/download/report_20240923_140530.pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

### Delete PDF
```
DELETE /api/v1/pdf/:filename
```

**Response:**
```json
{
  "message": "PDF deleted successfully"
}
```

## Authentication

All PDF generation endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## File Storage

Generated PDF files are stored in the `uploads/pdf/` directory. The files are named with the following pattern:
- Reports: `{report_type}_{timestamp}.pdf`
- Letters: `{letter_type}_{student_id}_{timestamp}.pdf`

## Language Support

The system supports both Thai and English languages for letters:
- Thai (`th`): Uses Thai university letterhead and content
- English (`en`): Uses English university letterhead and content

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Requested resource not found
- `500 Internal Server Error`: Server-side errors during PDF generation

## Examples

### Generate Student List Report
```bash
curl -X POST http://localhost:8080/api/v1/pdf/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "report_type": "student_list",
    "title": "Student List Report - Semester 1/2024",
    "student_ids": [1, 2, 3, 4, 5]
  }'
```

### Generate Coop Request Letter
```bash
curl -X POST http://localhost:8080/api/v1/pdf/letters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "letter_type": "coop_request",
    "student_id": 1,
    "training_id": 1,
    "recipient": "HR Manager",
    "language": "th"
  }'
```

### Download PDF
```bash
curl -X GET http://localhost:8080/api/v1/pdf/download/report_20240923_140530.pdf \
  -H "Authorization: Bearer <token>" \
  -o report.pdf
```

## Dependencies

The PDF generation functionality uses the following Go libraries:
- `github.com/johnfercher/maroto/v2`: PDF generation library
- `github.com/jung-kurt/gofpdf/v2`: Additional PDF utilities

## Testing

The PDF functionality includes comprehensive unit and integration tests:
- Service layer tests: `internal/services/pdf_test.go`
- Handler layer tests: `internal/handlers/pdf_test.go`

Run tests with:
```bash
go test ./internal/services -v -run TestPDFService
go test ./internal/handlers -v -run TestPDFHandler
```