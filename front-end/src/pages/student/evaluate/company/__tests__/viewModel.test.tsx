import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import useViewModel from '../viewModel'
import { StudentService } from '../../../../../service/api/student'

// Mock the StudentService
vi.mock('../../../../../service/api/student', () => ({
  StudentService: vi.fn().mockImplementation(() => ({
    checkEvaluationStatus: vi.fn(),
    getStudentEvaluateCompany: vi.fn(),
    putStudentEvaluateCompany: vi.fn(),
  })),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('useViewModel Hook', () => {
  let mockStudentService: {
    checkEvaluationStatus: Mock
    getStudentEvaluateCompany: Mock
    putStudentEvaluateCompany: Mock
  }

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

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useViewModel(1), { wrapper })

    expect(result.current.student).toEqual([])
    expect(result.current.evaluationStatus).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isStatusLoading).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.statusError).toBeNull()
    expect(result.current.submissionSuccess).toBe(false)
    expect(result.current.submissionMessage).toBeNull()
    expect(result.current.validationError).toBeNull()
    expect(result.current.isValidating).toBe(false)
  })

  it('validates URL parameters correctly - missing ID', () => {
    const { result } = renderHook(() => useViewModel(0), { wrapper })

    expect(result.current.validationError).toBe(
      'Company ID is required. Please provide a valid company ID in the URL.'
    )
  })

  it('validates URL parameters correctly - invalid ID', () => {
    const { result } = renderHook(() => useViewModel(-1), { wrapper })

    expect(result.current.validationError).toBe(
      'Invalid company ID. Please provide a valid numeric company ID.'
    )
  })

  it('validates URL parameters correctly - valid ID', async () => {
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await waitFor(() => {
      expect(result.current.validationError).toBeNull()
    })
  })

  it('checks evaluation status successfully', async () => {
    const mockStatusResponse = {
      hasEvaluated: true,
      evaluationDate: '2024-01-15T10:30:00Z',
      companyName: 'Test Company'
    }

    mockStudentService.checkEvaluationStatus.mockResolvedValue(mockStatusResponse)
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await waitFor(() => {
      expect(result.current.evaluationStatus).toEqual(mockStatusResponse)
      expect(result.current.isStatusLoading).toBe(false)
      expect(result.current.statusError).toBeNull()
    })
  })

  it('handles evaluation status check error', async () => {
    const mockError = new Error('Company not found')
    mockStudentService.checkEvaluationStatus.mockRejectedValue(mockError)
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await waitFor(() => {
      expect(result.current.statusError).toBe(
        'Company not found. Please check the company ID and try again.'
      )
      expect(result.current.isStatusLoading).toBe(false)
    })
  })

  it('fetches student enrollments successfully', async () => {
    const mockStudentData = [
      {
        id: 1,
        studentTrainingId: 1,
        score: null,
        questions: 'Test question',
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

    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue(mockStudentData)

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await waitFor(() => {
      expect(result.current.student).toEqual(mockStudentData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('handles student enrollment fetch error', async () => {
    const mockError = { response: { status: 404 } }
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockRejectedValue(mockError)

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBe(
        'Company not found. The specified company ID does not exist.'
      )
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('submits evaluation successfully', async () => {
    const mockSubmissionResponse = {
      success: true,
      message: 'Evaluation submitted successfully',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    }

    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])
    mockStudentService.putStudentEvaluateCompany.mockResolvedValue(mockSubmissionResponse)

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await act(async () => {
      await result.current.handleOnsubmit({
        ids: [1],
        scores: [85],
        comment: 'Great company'
      })
    })

    expect(result.current.submissionSuccess).toBe(true)
    expect(result.current.submissionMessage).toBe('Evaluation submitted successfully')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('handles evaluation submission error', async () => {
    const mockError = new Error('Validation failed')
    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])
    mockStudentService.putStudentEvaluateCompany.mockRejectedValue(mockError)

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await act(async () => {
      await result.current.handleOnsubmit({
        ids: [1],
        scores: [85],
        comment: 'Great company'
      })
    })

    expect(result.current.error).toBe('Validation failed')
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.submissionSuccess).toBe(false)
  })

  it('handles different error types correctly', async () => {
    const testCases = [
      {
        error: new Error('Unauthorized'),
        expectedMessage: 'You are not authorized to view this evaluation.'
      },
      {
        error: new Error('Access forbidden'),
        expectedMessage: 'Access denied. You can only view your own evaluations.'
      },
      {
        error: new Error('Network Error'),
        expectedMessage: 'Network error. Please check your connection and try again.'
      }
    ]

    for (const testCase of testCases) {
      mockStudentService.checkEvaluationStatus.mockRejectedValue(testCase.error)
      mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])

      const { result } = renderHook(() => useViewModel(1), { wrapper })

      await waitFor(() => {
        expect(result.current.statusError).toBe(testCase.expectedMessage)
      })

      vi.clearAllMocks()
      mockStudentService = {
        checkEvaluationStatus: vi.fn(),
        getStudentEvaluateCompany: vi.fn(),
        putStudentEvaluateCompany: vi.fn(),
      }
      ;(StudentService as any).mockImplementation(() => mockStudentService)
    }
  })

  it('navigates after successful submission', async () => {
    const mockSubmissionResponse = {
      success: true,
      message: 'Evaluation submitted successfully',
      redirectUrl: '/company_evaluation/company?id=1',
      evaluationId: 1
    }

    mockStudentService.checkEvaluationStatus.mockResolvedValue({
      hasEvaluated: false,
      companyName: 'Test Company'
    })
    mockStudentService.getStudentEvaluateCompany.mockResolvedValue([])
    mockStudentService.putStudentEvaluateCompany.mockResolvedValue(mockSubmissionResponse)

    const { result } = renderHook(() => useViewModel(1), { wrapper })

    await act(async () => {
      await result.current.handleOnsubmit({
        ids: [1],
        scores: [85],
        comment: 'Great company'
      })
    })

    // Wait for navigation timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1600))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/company_evaluation/company?id=1', { replace: true })
  })

  it('clears submission success state after timeout', async () => {
    const { result } = renderHook(() => useViewModel(1), { wrapper })

    // Manually set submission success
    act(() => {
      result.current.handleOnsubmit({
        ids: [1],
        scores: [85],
        comment: 'Great company'
      })
    })

    // Wait for the timeout to clear the success state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 3100))
    })

    expect(result.current.submissionSuccess).toBe(false)
    expect(result.current.submissionMessage).toBeNull()
  })
})