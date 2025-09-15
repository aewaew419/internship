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

// Mock useSearchParams
const mockSearchParams = new URLSearchParams('?id=1')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams],
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

describe('Complete Evaluation Workflow Integration Tests', () => {
  let mockStudentService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockStudentService = {
      checkEvaluationStatus: vi.fn(),
      getStudentEvaluateCompany: vi.fn(),
      putStudentEvaluateCompany: vi.fn(),
    }
    ;(StudentService as any).mockImplementation(() => mockStudentService)
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

  it('completes full evaluation workflow - from form to success', async () => {
    // Setup initial state - not evaluated
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading evaluation data...')).not.toBeInTheDocument()
    })

    // Verify form is displayed
    expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
    expect(screen.getByText('1.How would you rate the overall experience?')).toBeInTheDocument()

    // Setup successful submission
    mockStudentService.putStudentEvaluateCompany.mockResolvedValue({
      success: true,
      message: 'Evaluation submitted successfully',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    })

    // Setup post-submission status check
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: true,
      evaluationDate: '2024-01-15T10:30:00Z',
      companyName: 'Test Company'
    })

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText('Evaluation submitted successfully')).toBeInTheDocument()
    })

    // Verify success message is displayed
    const successAlert = screen.getByTestId('alert')
    expect(successAlert).toHaveAttribute('data-severity', 'success')
  })

  it('handles evaluation workflow with existing evaluation', async () => {
    // Setup state - already evaluated
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: true,
      evaluationDate: '2024-01-15T10:30:00Z',
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking evaluation status...')).not.toBeInTheDocument()
    })

    // Verify status display is shown instead of form
    expect(screen.getByText('สถานะการประเมิน')).toBeInTheDocument()
    expect(screen.getByTestId('evaluation-status')).toBeInTheDocument()
    expect(screen.getByText('คุณได้ประเมินบริษัท "Test Company" เรียบร้อยแล้ว')).toBeInTheDocument()

    // Verify form is not displayed
    expect(screen.queryByText('กรุณาให้คะแนน')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('handles network errors gracefully throughout workflow', async () => {
    // Setup network error for status check
    mockStudentService.checkEvaluationStatus.mockRejectedValue(new Error('Network Error'))
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
    })

    // Verify error handling UI
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
    expect(screen.getByText('Connection Issue:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('handles submission errors and allows retry', async () => {
    // Setup initial state - not evaluated
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
    mockStudentService.putStudentEvaluateCompany.mockRejectedValue(new Error('Validation failed'))

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument()
    })

    // Verify error is displayed and form is still available for retry
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('handles invalid company ID workflow', async () => {
    // Mock invalid ID in URL
    const invalidSearchParams = new URLSearchParams('?id=invalid')
    vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([invalidSearchParams])

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText('Invalid company ID. Please provide a valid numeric company ID.')).toBeInTheDocument()
    })

    // Verify validation error UI
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
    expect(screen.getByText('URL Parameter Error:')).toBeInTheDocument()
    expect(screen.getByText('Expected URL Format:')).toBeInTheDocument()
  })

  it('handles company not found workflow', async () => {
    // Setup company not found error
    mockStudentService.checkEvaluationStatus.mockRejectedValue(new Error('Company not found'))
    mockStudentService.getStudentEvaluateCompany.mockRejectedValue({ response: { status: 404 } })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Company not found. Please check the company ID and try again.')).toBeInTheDocument()
    })

    // Verify troubleshooting information is displayed
    expect(screen.getByText('Troubleshooting:')).toBeInTheDocument()
    expect(screen.getByText('• Check if the company ID in the URL is correct')).toBeInTheDocument()
  })

  it('handles unauthorized access workflow', async () => {
    // Setup unauthorized error
    mockStudentService.checkEvaluationStatus.mockRejectedValue(new Error('Unauthorized'))
    mockStudentService.getStudentEvaluateCompany.mockRejectedValue({ response: { status: 401 } })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('You are not authorized to view this evaluation.')).toBeInTheDocument()
    })

    // Verify access issue troubleshooting is displayed
    expect(screen.getByText('Access Issue:')).toBeInTheDocument()
    expect(screen.getByText('• Make sure you are logged in with the correct account')).toBeInTheDocument()
  })

  it('displays loading states correctly throughout workflow', async () => {
    // Setup delayed responses to test loading states
    let resolveStatusCheck: (value: any) => void
    let resolveDataFetch: (value: any) => void

    const statusPromise = new Promise(resolve => { resolveStatusCheck = resolve })
    const dataPromise = new Promise(resolve => { resolveDataFetch = resolve })

    mockStudentService.checkEvaluationStatus.mockReturnValue(statusPromise)
    mockStudentService.getStudentEvaluateCompany.mockReturnValue(dataPromise)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Initially should show status loading
    expect(screen.getByText('Checking evaluation status...')).toBeInTheDocument()
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument()

    // Resolve status check
    resolveStatusCheck({
      hasEvaluated: false,
      companyName: 'Test Company'
    })

    // Should now show data loading
    await waitFor(() => {
      expect(screen.getByText('Loading evaluation data...')).toBeInTheDocument()
    })

    // Resolve data fetch
    resolveDataFetch(mockStudentData)

    // Should show the form
    await waitFor(() => {
      expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument()
  })

  it('handles complete workflow with multiple evaluation questions', async () => {
    const multipleQuestionsData = [
      {
        id: 1,
        studentTrainingId: 1,
        score: null,
        questions: 'How would you rate the overall experience?',
        comment: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        student_training: mockStudentData[0].student_training
      },
      {
        id: 2,
        studentTrainingId: 1,
        score: null,
        questions: 'How would you rate the work environment?',
        comment: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        student_training: mockStudentData[0].student_training
      },
      {
        id: 3,
        studentTrainingId: 1,
        score: null,
        questions: 'How would you rate the mentorship quality?',
        comment: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        student_training: mockStudentData[0].student_training
      }
    ]

    // Setup initial state - not evaluated
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(multipleQuestionsData)

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
    })

    // Verify all questions are displayed
    expect(screen.getByText('1.How would you rate the overall experience?')).toBeInTheDocument()
    expect(screen.getByText('2.How would you rate the work environment?')).toBeInTheDocument()
    expect(screen.getByText('3.How would you rate the mentorship quality?')).toBeInTheDocument()

    // Setup successful submission
    mockStudentService.putStudentEvaluateCompany.mockResolvedValue({
      success: true,
      message: 'All evaluations submitted successfully',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    })

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText('All evaluations submitted successfully')).toBeInTheDocument()
    })

    // Verify submission was called with correct data structure
    expect(mockStudentService.putStudentEvaluateCompany).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        ids: [1, 2, 3],
        scores: expect.any(Array),
        comment: expect.any(String)
      })
    )
  })

  it('handles workflow state transitions correctly', async () => {
    // Test the complete state transition from form → submission → success → status display
    
    // Initial state - not evaluated
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

    // Setup submission response
    mockStudentService.putStudentEvaluateCompany.mockResolvedValue({
      success: true,
      message: 'Evaluation submitted successfully',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    })

    // Setup post-submission status check to return evaluated
    mockStudentService.checkEvaluationStatus.mockResolvedValueOnce({
      hasEvaluated: true,
      evaluationDate: '2024-01-15T10:30:00Z',
      companyName: 'Test Company'
    })

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Should show submitting state
    await waitFor(() => {
      expect(screen.getByText('กำลังส่ง...')).toBeInTheDocument()
    })

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Evaluation submitted successfully')).toBeInTheDocument()
    })

    // Verify success alert is displayed
    const successAlert = screen.getByTestId('alert')
    expect(successAlert).toHaveAttribute('data-severity', 'success')

    // Verify that checkEvaluationStatus was called again after submission
    expect(mockStudentService.checkEvaluationStatus).toHaveBeenCalledTimes(2)
  })

  it('handles edge case scenarios in complete workflow', async () => {
    // Test various edge cases that might occur during the workflow
    
    const edgeCaseScenarios = [
      {
        name: 'Empty evaluation data',
        mockData: [],
        expectedBehavior: 'should handle empty data gracefully'
      },
      {
        name: 'Malformed student training data',
        mockData: [{
          id: 1,
          studentTrainingId: 1,
          score: null,
          questions: 'Test question',
          comment: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          student_training: null // Malformed data
        }],
        expectedBehavior: 'should handle missing student_training data'
      }
    ]

    for (const scenario of edgeCaseScenarios) {
      // Reset mocks for each scenario
      vi.clearAllMocks()
      
      mockStudentService.checkEvaluationStatus.mockResolvedValue({
        hasEvaluated: false,
        companyName: 'Test Company'
      })
      mockStudentService.getStudentEvaluateCompany.mockResolvedValue(scenario.mockData)

      const { unmount } = render(<StudentEvaluateCompanyPerCompany />, { wrapper })

      // Wait for component to handle the scenario
      await waitFor(() => {
        // Component should not crash and should handle the edge case
        expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
      }, { timeout: 3000 })

      unmount()
    }
  })

  it('verifies complete accessibility workflow', async () => {
    // Test that the complete workflow maintains accessibility standards
    
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

    // Verify form has proper labels and structure
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toHaveAttribute('disabled')

    // Verify radio buttons are accessible
    const radioButtons = screen.getAllByRole('radio')
    expect(radioButtons.length).toBeGreaterThan(0)

    // Verify text areas are accessible
    const textAreas = screen.getAllByRole('textbox')
    expect(textAreas.length).toBeGreaterThan(0)

    // Test keyboard navigation (basic check)
    submitButton.focus()
    expect(document.activeElement).toBe(submitButton)
  })

  it('handles complete workflow with session persistence', async () => {
    // Test that the workflow handles session-related scenarios
    
    // Simulate session expiry during workflow
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

    // Simulate session expiry during submission
    mockStudentService.putStudentEvaluateCompany.mockRejectedValue(
      new Error('Unauthorized access')
    )

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Should handle session expiry gracefully
    await waitFor(() => {
      expect(screen.getByText('Unauthorized access')).toBeInTheDocument()
    })

    // Verify error is displayed properly
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
  })

  it('handles submission loading state correctly', async () => {
    // Setup initial state
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

    // Setup delayed submission
    let resolveSubmission: (value: any) => void
    const submissionPromise = new Promise(resolve => { resolveSubmission = resolve })
    mockStudentService.putStudentEvaluateCompany.mockReturnValue(submissionPromise)

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Should show submitting state
    await waitFor(() => {
      expect(screen.getByText('กำลังส่ง...')).toBeInTheDocument()
    })

    // Resolve submission
    resolveSubmission({
      success: true,
      message: 'Evaluation submitted successfully',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    })

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Evaluation submitted successfully')).toBeInTheDocument()
    })
  })
})