import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import StudentEvaluateCompanyPerCompany from '../../pages/student/evaluate/company/index'
import { StudentService } from '../../service/api/student'

// Mock the StudentService
vi.mock('../../service/api/student')

// Mock the Layout component
vi.mock('../../component/layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

// Mock the Persona component
vi.mock('../../component/information', () => ({
  Persona: ({ id }: { id: number }) => <div data-testid="persona">Persona {id}</div>,
  EvaluationStatus: ({ isEvaluated, evaluationDate, showTimestamp }: any) => (
    <div data-testid="evaluation-status">
      Status: {isEvaluated ? 'Evaluated' : 'Not Evaluated'}
      {showTimestamp && evaluationDate && <span> - {evaluationDate}</span>}
    </div>
  ),
}))

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Alert: ({ severity, children }: any) => (
    <div data-testid="alert" data-severity={severity}>
      {children}
    </div>
  ),
  CircularProgress: ({ size }: any) => (
    <div data-testid="circular-progress" data-size={size}>
      Loading...
    </div>
  ),
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
}))

// Mock useSearchParams with different scenarios
const createMockSearchParams = (id: string) => new URLSearchParams(`?id=${id}`)
let mockSearchParams = createMockSearchParams('1')

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams],
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

describe('Complete User Journey Integration Tests', () => {
  let mockStudentService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockStudentService = {
      checkEvaluationStatus: vi.fn(),
      getStudentEvaluateCompany: vi.fn(),
      putStudentEvaluateCompany: vi.fn(),
    }
    ;(StudentService as any).mockImplementation(() => mockStudentService)
    
    // Reset to default search params
    mockSearchParams = createMockSearchParams('1')
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  )

  const mockStudentData = [
    {
      id: 1,
      studentTrainingId: 1,
      score: null,
      questions: 'How would you rate the overall experience?',
      comment: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      student_training: {
        id: 1,
        studentEnrollId: 1,
        companyId: 1,
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        documentLanguage: 'th' as const,
        coordinator: 'Test Coordinator',
        coordinatorPhoneNumber: '0123456789',
        coordinatorEmail: 'coordinator@test.com',
        supervisor: 'Test Supervisor',
        supervisorPhoneNumber: '0123456789',
        supervisorEmail: 'supervisor@test.com',
        department: 'IT Department',
        position: 'Intern',
        jobDescription: 'Software Development Intern',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    }
  ]

  it('completes full user journey: URL → Status Check → Form → Submit → Success', async () => {
    // Step 1: User navigates to URL with company ID
    mockSearchParams = createMockSearchParams('1')
    
    // Step 2: System checks evaluation status (not evaluated)
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'ABC Technology Company'
    })
    
    // Step 3: System loads evaluation form data
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Verify URL validation passes
    await waitFor(() => {
      expect(screen.queryByText('URL Parameter Error:')).not.toBeInTheDocument()
    })

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
    })

    // Verify form elements are present
    expect(screen.getByText('1.How would you rate the overall experience?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()

    // Step 4: User submits form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    
    // Setup successful submission response
    mockStudentService.putStudentEvaluateCompany.mockResolvedValue({
      success: true,
      message: 'การประเมินของคุณถูกส่งเรียบร้อยแล้ว',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    })

    fireEvent.click(submitButton)

    // Step 5: Verify success message
    await waitFor(() => {
      expect(screen.getByText('การประเมินของคุณถูกส่งเรียบร้อยแล้ว')).toBeInTheDocument()
    })

    // Verify success alert
    const successAlert = screen.getByTestId('alert')
    expect(successAlert).toHaveAttribute('data-severity', 'success')
  })

  it('handles returning user with completed evaluation', async () => {
    // User returns to already evaluated company
    mockSearchParams = createMockSearchParams('1')
    
    // System checks status (already evaluated)
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: true,
      evaluationDate: '2024-01-10T14:30:00Z',
      companyName: 'ABC Technology Company'
    })
    
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for status check to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking evaluation status...')).not.toBeInTheDocument()
    })

    // Verify status display instead of form
    expect(screen.getByText('สถานะการประเมิน')).toBeInTheDocument()
    expect(screen.getByTestId('evaluation-status')).toBeInTheDocument()
    expect(screen.getByText('คุณได้ประเมินบริษัท "ABC Technology Company" เรียบร้อยแล้ว')).toBeInTheDocument()

    // Verify form is not displayed
    expect(screen.queryByText('กรุณาให้คะแนน')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('handles invalid URL parameters', async () => {
    // User navigates with invalid company ID
    mockSearchParams = createMockSearchParams('invalid')

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Should show validation error immediately
    await waitFor(() => {
      expect(screen.getByText('URL Parameter Error:')).toBeInTheDocument()
    })

    expect(screen.getByText('Invalid company ID. Please provide a valid numeric company ID.')).toBeInTheDocument()
    expect(screen.getByText('Expected URL Format:')).toBeInTheDocument()

    // Should not attempt to load data
    expect(mockStudentService.checkEvaluationStatus).not.toHaveBeenCalled()
    expect(mockStudentService.getStudentEvaluateCompany).not.toHaveBeenCalled()
  })

  it('handles company not found error', async () => {
    mockSearchParams = createMockSearchParams('999')
    
    // API returns company not found
    mockStudentService.checkEvaluationStatus.mockRejectedValue(
      new Error('Company not found')
    )
    mockStudentService.getStudentEvaluateCompany.mockRejectedValue({
      response: { status: 404 }
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Company not found. Please check the company ID and try again.')).toBeInTheDocument()
    })

    // Verify troubleshooting information
    expect(screen.getByText('Troubleshooting:')).toBeInTheDocument()
    expect(screen.getByText('• Check if the company ID in the URL is correct')).toBeInTheDocument()
  })

  it('handles network errors with retry option', async () => {
    mockSearchParams = createMockSearchParams('1')
    
    // Simulate network error
    mockStudentService.checkEvaluationStatus.mockRejectedValue(
      new Error('Network error. Please check your connection and try again.')
    )

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
    })

    // Verify retry option is available
    expect(screen.getByText('Connection Issue:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('handles submission errors with form retry', async () => {
    mockSearchParams = createMockSearchParams('1')
    
    // Setup successful initial load
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
    })

    // Setup submission error
    mockStudentService.putStudentEvaluateCompany.mockRejectedValue(
      new Error('Validation failed - please check your input')
    )

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Validation failed - please check your input')).toBeInTheDocument()
    })

    // Verify error is displayed and form is still available for retry
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })
})