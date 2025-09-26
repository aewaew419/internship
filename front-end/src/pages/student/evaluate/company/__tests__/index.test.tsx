import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import StudentEvaluateCompanyPerCompany from '../index'
import useViewModel from '../viewModel'

// Mock the viewModel hook
vi.mock('../viewModel')

// Mock the Layout component
vi.mock('../../../../component/layout', () => ({
  Layout: ({ children, header }: { children: React.ReactNode; header: any[] }) => (
    <div data-testid="layout">
      <div data-testid="header">{JSON.stringify(header)}</div>
      {children}
    </div>
  ),
}))

// Mock the Persona component
vi.mock('../../../../component/information', () => ({
  Persona: ({ id }: { id: number }) => <div data-testid="persona">Persona {id}</div>,
  EvaluationStatus: ({ isEvaluated, evaluationDate, showTimestamp }: any) => (
    <div data-testid="evaluation-status">
      Status: {isEvaluated ? 'Evaluated' : 'Not Evaluated'}
      {showTimestamp && evaluationDate && <span> - {evaluationDate}</span>}
    </div>
  ),
}))

// Mock the input field components
vi.mock('../../../../component/input/field', () => ({
  RadioField: ({ name, label, options }: any) => (
    <div data-testid="radio-field">
      <label>{label}</label>
      {options.map((option: any, index: number) => (
        <input
          key={index}
          type="radio"
          name={name}
          value={option.value}
          data-testid={`radio-${name}-${option.value}`}
        />
      ))}
    </div>
  ),
  Field: ({ name, multiline }: any) => (
    <textarea
      name={name}
      data-testid={`field-${name}`}
      placeholder={multiline ? 'Multiline field' : 'Single line field'}
    />
  ),
}))

// Mock Formik
vi.mock('formik', () => ({
  Formik: ({ children, onSubmit, initialValues }: any) => (
    <div data-testid="formik">
      {children({ handleSubmit: () => onSubmit(initialValues) })}
    </div>
  ),
  Form: ({ children }: any) => <form data-testid="form">{children}</form>,
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
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

describe('StudentEvaluateCompanyPerCompany Component', () => {
  const mockUseViewModel = useViewModel as Mock

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultViewModelReturn = {
    student: [],
    evaluationStatus: null,
    isLoading: false,
    isStatusLoading: false,
    isSubmitting: false,
    error: null,
    statusError: null,
    submissionSuccess: false,
    submissionMessage: null,
    validationError: null,
    isValidating: false,
    handleOnsubmit: vi.fn(),
    checkEvaluationStatus: vi.fn(),
    fetchStudentEnrollments: vi.fn(),
    validateUrlParameters: vi.fn(),
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  )

  it('renders validation error when URL parameter is invalid', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      validationError: 'Company ID is required. Please provide a valid company ID in the URL.',
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
    expect(screen.getByText('URL Parameter Error:')).toBeInTheDocument()
    expect(screen.getByText('Company ID is required. Please provide a valid company ID in the URL.')).toBeInTheDocument()
    expect(screen.getByText('Expected URL Format:')).toBeInTheDocument()
  })

  it('renders loading state when validating', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      isValidating: true,
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByTestId('circular-progress')).toBeInTheDocument()
    expect(screen.getByText('Validating parameters...')).toBeInTheDocument()
  })

  it('renders loading state when checking status', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      isStatusLoading: true,
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByTestId('circular-progress')).toBeInTheDocument()
    expect(screen.getByText('Checking evaluation status...')).toBeInTheDocument()
  })

  it('renders loading state when loading data', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      isLoading: true,
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByTestId('circular-progress')).toBeInTheDocument()
    expect(screen.getByText('Loading evaluation data...')).toBeInTheDocument()
  })

  it('renders error state with retry button for network errors', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      error: 'Network error occurred',
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error')
    expect(screen.getByText('Network error occurred')).toBeInTheDocument()
    expect(screen.getByText('Connection Issue:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders error state with troubleshooting for company not found', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      error: 'Company not found',
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByText('Troubleshooting:')).toBeInTheDocument()
    expect(screen.getByText('• Check if the company ID in the URL is correct')).toBeInTheDocument()
  })

  it('renders error state with troubleshooting for access denied', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      error: 'Access denied',
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByText('Access Issue:')).toBeInTheDocument()
    expect(screen.getByText('• Make sure you are logged in with the correct account')).toBeInTheDocument()
  })

  it('renders evaluation status when already evaluated', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      student: [{
        id: 1,
        studentTrainingId: 1,
        score: 85,
        questions: 'Test question',
        comment: 'Test comment',
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
      }],
      evaluationStatus: {
        hasEvaluated: true,
        evaluationDate: '2024-01-15T10:30:00Z',
        companyName: 'Test Company'
      },
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByText('สถานะการประเมิน')).toBeInTheDocument()
    expect(screen.getByTestId('evaluation-status')).toBeInTheDocument()
    expect(screen.getByText('คุณได้ประเมินบริษัท "Test Company" เรียบร้อยแล้ว')).toBeInTheDocument()
    expect(screen.getByText('ขอบคุณสำหรับการให้ข้อมูลย้อนกลับ')).toBeInTheDocument()
  })

  it('renders evaluation form when not yet evaluated', () => {
    const mockHandleOnsubmit = vi.fn()
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      student: [{
        id: 1,
        studentTrainingId: 1,
        score: null,
        questions: 'How would you rate the company?',
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
      }],
      evaluationStatus: {
        hasEvaluated: false,
        companyName: 'Test Company'
      },
      handleOnsubmit: mockHandleOnsubmit,
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByText('กรุณาให้คะแนน')).toBeInTheDocument()
    expect(screen.getByText('(1 = น้อยมาก, 5 = มากที่สุด)')).toBeInTheDocument()
    expect(screen.getByText('1.How would you rate the company?')).toBeInTheDocument()
    expect(screen.getByText('ข้อเสนอแนะเพิ่มเติม')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('renders success message after form submission', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      student: [{
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
      }],
      evaluationStatus: {
        hasEvaluated: false,
        companyName: 'Test Company'
      },
      submissionSuccess: true,
      submissionMessage: 'Evaluation submitted successfully',
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    const successAlert = screen.getByTestId('alert')
    expect(successAlert).toHaveAttribute('data-severity', 'success')
    expect(screen.getByText('Evaluation submitted successfully')).toBeInTheDocument()
  })

  it('shows submitting state when form is being submitted', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      student: [{
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
      }],
      evaluationStatus: {
        hasEvaluated: false,
        companyName: 'Test Company'
      },
      isSubmitting: true,
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByText('กำลังส่ง...')).toBeInTheDocument()
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument()
  })

  it('renders persona component when student data is available', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      student: [{
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
      }],
      evaluationStatus: {
        hasEvaluated: false,
        companyName: 'Test Company'
      },
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByTestId('persona')).toBeInTheDocument()
    expect(screen.getByText('Persona 1')).toBeInTheDocument()
  })

  it('handles retry button click', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
    
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      error: 'Network error occurred',
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(retryButton)

    expect(reloadSpy).toHaveBeenCalled()
    
    reloadSpy.mockRestore()
  })

  it('renders multiple evaluation questions', () => {
    mockUseViewModel.mockReturnValue({
      ...defaultViewModelReturn,
      student: [
        {
          id: 1,
          studentTrainingId: 1,
          score: null,
          questions: 'Question 1',
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
        },
        {
          id: 2,
          studentTrainingId: 1,
          score: null,
          questions: 'Question 2',
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
      ],
      evaluationStatus: {
        hasEvaluated: false,
        companyName: 'Test Company'
      },
    })

    render(<StudentEvaluateCompanyPerCompany />, { wrapper })

    expect(screen.getByText('1.Question 1')).toBeInTheDocument()
    expect(screen.getByText('2.Question 2')).toBeInTheDocument()
  })
})