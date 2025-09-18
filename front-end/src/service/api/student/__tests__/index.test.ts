import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { StudentService } from '../index'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any

// Mock localStorage utility
vi.mock('../../../../utils/localStorage', () => ({
  useToken: () => ({
    user: {
      students: {
        id: 1
      }
    }
  })
}))

describe('StudentService API Client', () => {
  let studentService: StudentService
  let mockAxiosInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockAxiosInstance = {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
    }

    studentService = new StudentService()
    // Mock the getAxiosInstance method
    vi.spyOn(studentService, 'getAxiosInstance').mockReturnValue(mockAxiosInstance)
  })

  describe('checkEvaluationStatus', () => {
    it('returns evaluation status successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          hasEvaluated: true,
          evaluationDate: '2024-01-15T10:30:00Z',
          companyName: 'Test Company',
          companyId: 1
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await studentService.checkEvaluationStatus(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/evaluate/company/1/status')
      expect(result).toEqual(mockResponse.data)
    })

    it('handles 404 error correctly', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.checkEvaluationStatus(1))
        .rejects.toThrow('Company not found or invalid student training ID')
    })

    it('handles 401 error correctly', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.checkEvaluationStatus(1))
        .rejects.toThrow('Unauthorized access')
    })

    it('handles 403 error correctly', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.checkEvaluationStatus(1))
        .rejects.toThrow('Access forbidden - evaluation not allowed')
    })

    it('re-throws other errors', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.checkEvaluationStatus(1))
        .rejects.toThrow('Network error')
    })
  })

  describe('getStudentEvaluateCompany', () => {
    it('returns student evaluation data successfully', async () => {
      const mockResponse = {
        data: [
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
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await studentService.getStudentEvaluateCompany(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/evaluate/company/1')
      expect(result).toEqual(mockResponse.data)
    })

    it('handles 404 error with custom message', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.getStudentEvaluateCompany(1))
        .rejects.toThrow('Company not found or invalid student training ID')
    })

    it('handles 401 error with custom message', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.getStudentEvaluateCompany(1))
        .rejects.toThrow('Unauthorized access - please log in')
    })

    it('handles 403 error with custom message', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.getStudentEvaluateCompany(1))
        .rejects.toThrow('Access forbidden - you can only view your own evaluations')
    })

    it('handles 400 error with custom message', async () => {
      const mockError = {
        response: { status: 400 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.getStudentEvaluateCompany(1))
        .rejects.toThrow('Invalid request - please check the company ID')
    })

    it('handles 500+ errors with custom message', async () => {
      const mockError = {
        response: { status: 500 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(studentService.getStudentEvaluateCompany(1))
        .rejects.toThrow('Server error - please try again later')
    })
  })

  describe('putStudentEvaluateCompany', () => {
    it('submits evaluation successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Evaluation submitted successfully',
          redirectUrl: '/company_evaluation/company?id=1',
          evaluationId: 1
        }
      }

      const evaluationData = {
        ids: [1],
        scores: [85],
        comment: 'Great company'
      }

      mockAxiosInstance.put.mockResolvedValue(mockResponse)

      const result = await studentService.putStudentEvaluateCompany(1, evaluationData)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/student/evaluate/company/1', evaluationData)
      expect(result).toEqual(mockResponse.data)
    })

    it('handles 404 error during submission', async () => {
      const mockError = {
        response: { status: 404 }
      }

      const evaluationData = {
        ids: [1],
        scores: [85],
        comment: 'Great company'
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(studentService.putStudentEvaluateCompany(1, evaluationData))
        .rejects.toThrow('Student training not found')
    })

    it('handles 401 error during submission', async () => {
      const mockError = {
        response: { status: 401 }
      }

      const evaluationData = {
        ids: [1],
        scores: [85],
        comment: 'Great company'
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(studentService.putStudentEvaluateCompany(1, evaluationData))
        .rejects.toThrow('Unauthorized access')
    })

    it('handles 422 validation error during submission', async () => {
      const mockError = {
        response: { status: 422 }
      }

      const evaluationData = {
        ids: [1],
        scores: [150], // Invalid score
        comment: 'Great company'
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(studentService.putStudentEvaluateCompany(1, evaluationData))
        .rejects.toThrow('Validation failed - please check your input')
    })

    it('re-throws other errors during submission', async () => {
      const mockError = new Error('Network error')
      const evaluationData = {
        ids: [1],
        scores: [85],
        comment: 'Great company'
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(studentService.putStudentEvaluateCompany(1, evaluationData))
        .rejects.toThrow('Network error')
    })
  })

  describe('API endpoint paths', () => {
    it('uses correct endpoint for status check', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} })

      await studentService.checkEvaluationStatus(123)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/evaluate/company/123/status')
    })

    it('uses correct endpoint for getting evaluation data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await studentService.getStudentEvaluateCompany(456)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/evaluate/company/456')
    })

    it('uses correct endpoint for submitting evaluation', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} })

      const evaluationData = {
        ids: [1],
        scores: [85],
        comment: 'Test comment'
      }

      await studentService.putStudentEvaluateCompany(789, evaluationData)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/student/evaluate/company/789', evaluationData)
    })
  })

  describe('error handling consistency', () => {
    it('maintains consistent error message format across methods', async () => {
      const methods = [
        () => studentService.checkEvaluationStatus(1),
        () => studentService.getStudentEvaluateCompany(1),
        () => studentService.putStudentEvaluateCompany(1, { ids: [1], scores: [85], comment: '' })
      ]

      for (const method of methods) {
        const mockError = {
          response: { status: 401 }
        }

        mockAxiosInstance.get.mockRejectedValue(mockError)
        mockAxiosInstance.put.mockRejectedValue(mockError)

        try {
          await method()
        } catch (error: any) {
          expect(error.message).toContain('Unauthorized')
        }
      }
    })

    it('handles network errors consistently', async () => {
      const networkError = new Error('Network Error')
      const methods = [
        () => studentService.checkEvaluationStatus(1),
        () => studentService.getStudentEvaluateCompany(1),
        () => studentService.putStudentEvaluateCompany(1, { ids: [1], scores: [85], comment: '' })
      ]

      for (const method of methods) {
        mockAxiosInstance.get.mockRejectedValue(networkError)
        mockAxiosInstance.put.mockRejectedValue(networkError)

        await expect(method()).rejects.toThrow('Network Error')
      }
    })
  })
})