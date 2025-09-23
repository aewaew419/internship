import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InternshipApprovalService } from '../InternshipApprovalService'
import type { ApprovalStatusData, CommitteeVotingData, InternshipApprovalStatus } from '../type'

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

describe('InternshipApprovalService API Client', () => {
  let internshipApprovalService: InternshipApprovalService
  let mockAxiosInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    }

    internshipApprovalService = new InternshipApprovalService()
    // Mock the getAxiosInstance method
    vi.spyOn(internshipApprovalService, 'getAxiosInstance').mockReturnValue(mockAxiosInstance)
  })

  describe('getApprovalStatus', () => {
    it('returns approval status successfully', async () => {
      const mockResponse = {
        data: {
          studentEnrollId: 1,
          currentStatus: 'registered' as InternshipApprovalStatus,
          statusText: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
          statusUpdatedAt: '2024-01-15T10:30:00Z',
          committeeVotes: [],
          approvalPercentage: 0,
          statusHistory: []
        } as ApprovalStatusData
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await internshipApprovalService.getApprovalStatus(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/enrollments/1/approval-status')
      expect(result).toEqual(mockResponse.data)
    })

    it('handles 404 error correctly', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getApprovalStatus(1))
        .rejects.toThrow('Student enrollment not found or invalid ID')
    })

    it('handles 401 error correctly', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getApprovalStatus(1))
        .rejects.toThrow('Unauthorized access - please log in')
    })

    it('handles 403 error correctly', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getApprovalStatus(1))
        .rejects.toThrow('Access forbidden - you can only view your own approval status')
    })

    it('handles 500+ errors correctly', async () => {
      const mockError = {
        response: { status: 500 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getApprovalStatus(1))
        .rejects.toThrow('Server error - please try again later')
    })

    it('handles generic errors correctly', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getApprovalStatus(1))
        .rejects.toThrow('Failed to get approval status: Network error')
    })
  })

  describe('submitAdvisorApproval', () => {
    it('submits advisor approval successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitAdvisorApproval(1, true, 'Approved by advisor')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/student/enrollments/1/advisor-approval',
        { approved: true, remarks: 'Approved by advisor' }
      )
    })

    it('submits advisor rejection successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitAdvisorApproval(1, false, 'Needs improvement')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/student/enrollments/1/advisor-approval',
        { approved: false, remarks: 'Needs improvement' }
      )
    })

    it('submits approval without remarks', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitAdvisorApproval(1, true)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/student/enrollments/1/advisor-approval',
        { approved: true, remarks: undefined }
      )
    })

    it('handles 404 error correctly', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Student enrollment not found')
    })

    it('handles 401 error correctly', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Unauthorized access - please log in')
    })

    it('handles 403 error correctly', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Access forbidden - you are not authorized to approve this application')
    })

    it('handles 422 validation error correctly', async () => {
      const mockError = {
        response: { status: 422 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Validation failed - invalid approval data')
    })

    it('handles 409 conflict error correctly', async () => {
      const mockError = {
        response: { status: 409 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Approval conflict - this application may have already been processed')
    })

    it('handles 500+ errors correctly', async () => {
      const mockError = {
        response: { status: 500 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Server error - please try again later')
    })

    it('handles generic errors correctly', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitAdvisorApproval(1, true))
        .rejects.toThrow('Failed to submit advisor approval: Network error')
    })
  })
  
describe('submitCommitteeVote', () => {
    it('submits committee approval vote successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitCommitteeVote(1, 'approve', 'Good application')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/student/enrollments/1/committee-vote',
        { vote: 'approve', remarks: 'Good application' }
      )
    })

    it('submits committee rejection vote successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitCommitteeVote(1, 'reject', 'Insufficient documentation')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/student/enrollments/1/committee-vote',
        { vote: 'reject', remarks: 'Insufficient documentation' }
      )
    })

    it('submits vote without remarks', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitCommitteeVote(1, 'approve')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/student/enrollments/1/committee-vote',
        { vote: 'approve', remarks: undefined }
      )
    })

    it('handles 404 error correctly', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Student enrollment not found')
    })

    it('handles 401 error correctly', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Unauthorized access - please log in')
    })

    it('handles 403 error correctly', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Access forbidden - you are not authorized to vote on this application')
    })

    it('handles 422 validation error correctly', async () => {
      const mockError = {
        response: { status: 422 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Validation failed - invalid vote data')
    })

    it('handles 409 conflict error correctly', async () => {
      const mockError = {
        response: { status: 409 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Vote conflict - you may have already voted on this application')
    })

    it('handles 500+ errors correctly', async () => {
      const mockError = {
        response: { status: 500 }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Server error - please try again later')
    })

    it('handles generic errors correctly', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(internshipApprovalService.submitCommitteeVote(1, 'approve'))
        .rejects.toThrow('Failed to submit committee vote: Network error')
    })
  })

  describe('getCommitteeVotingStatus', () => {
    it('returns committee voting status successfully', async () => {
      const mockResponse = {
        data: {
          studentEnrollId: 1,
          totalCommitteeMembers: 5,
          currentVotes: [
            {
              instructorId: 1,
              vote: 'approve' as const,
              votedAt: '2024-01-15T10:30:00Z',
              remarks: 'Good application'
            },
            {
              instructorId: 2,
              vote: 'approve' as const,
              votedAt: '2024-01-15T11:00:00Z'
            }
          ],
          approvalPercentage: 40,
          votingComplete: false
        } as CommitteeVotingData
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await internshipApprovalService.getCommitteeVotingStatus(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/enrollments/1/committee-voting')
      expect(result).toEqual(mockResponse.data)
    })

    it('handles 404 error correctly', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getCommitteeVotingStatus(1))
        .rejects.toThrow('Student enrollment not found or no committee voting data available')
    })

    it('handles 401 error correctly', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getCommitteeVotingStatus(1))
        .rejects.toThrow('Unauthorized access - please log in')
    })

    it('handles 403 error correctly', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getCommitteeVotingStatus(1))
        .rejects.toThrow('Access forbidden - you are not authorized to view committee voting data')
    })

    it('handles 500+ errors correctly', async () => {
      const mockError = {
        response: { status: 500 }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getCommitteeVotingStatus(1))
        .rejects.toThrow('Server error - please try again later')
    })

    it('handles generic errors correctly', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(internshipApprovalService.getCommitteeVotingStatus(1))
        .rejects.toThrow('Failed to get committee voting status: Network error')
    })
  })

  describe
describe('updateApprovalStatus', () => {
    it('updates approval status successfully', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} })

      await internshipApprovalService.updateApprovalStatus(1, 'c.approved', 'Administrative approval')

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/student/enrollments/1/approval-status',
        { status: 'c.approved', reason: 'Administrative approval' }
      )
    })

    it('updates status without reason', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} })

      await internshipApprovalService.updateApprovalStatus(1, 'doc.cancel')

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/student/enrollments/1/approval-status',
        { status: 'doc.cancel', reason: undefined }
      )
    })

    it('handles 404 error correctly', async () => {
      const mockError = {
        response: { status: 404 }
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Student enrollment not found')
    })

    it('handles 401 error correctly', async () => {
      const mockError = {
        response: { status: 401 }
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Unauthorized access - please log in')
    })

    it('handles 403 error correctly', async () => {
      const mockError = {
        response: { status: 403 }
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Access forbidden - you are not authorized to update approval status')
    })

    it('handles 422 validation error correctly', async () => {
      const mockError = {
        response: { status: 422 }
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Validation failed - invalid status transition')
    })

    it('handles 409 conflict error correctly', async () => {
      const mockError = {
        response: { status: 409 }
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Status conflict - invalid status transition')
    })

    it('handles 500+ errors correctly', async () => {
      const mockError = {
        response: { status: 500 }
      }

      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Server error - please try again later')
    })

    it('handles generic errors correctly', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.put.mockRejectedValue(mockError)

      await expect(internshipApprovalService.updateApprovalStatus(1, 'c.approved'))
        .rejects.toThrow('Failed to update approval status: Network error')
    })
  })

  describe('API endpoint paths', () => {
    it('uses correct endpoint for getting approval status', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} })

      await internshipApprovalService.getApprovalStatus(123)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/enrollments/123/approval-status')
    })

    it('uses correct endpoint for advisor approval', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitAdvisorApproval(456, true)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/student/enrollments/456/advisor-approval', { approved: true, remarks: undefined })
    })

    it('uses correct endpoint for committee voting', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitCommitteeVote(789, 'approve')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/student/enrollments/789/committee-vote', { vote: 'approve', remarks: undefined })
    })

    it('uses correct endpoint for getting committee voting status', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} })

      await internshipApprovalService.getCommitteeVotingStatus(101)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/enrollments/101/committee-voting')
    })

    it('uses correct endpoint for updating approval status', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} })

      await internshipApprovalService.updateApprovalStatus(202, 'c.approved')

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/student/enrollments/202/approval-status', { status: 'c.approved', reason: undefined })
    })
  })

  describe('error handling consistency', () => {
    it('maintains consistent error message format across methods', async () => {
      const methods = [
        () => internshipApprovalService.getApprovalStatus(1),
        () => internshipApprovalService.getCommitteeVotingStatus(1),
        () => internshipApprovalService.submitAdvisorApproval(1, true),
        () => internshipApprovalService.submitCommitteeVote(1, 'approve'),
        () => internshipApprovalService.updateApprovalStatus(1, 'c.approved')
      ]

      for (const method of methods) {
        const mockError = {
          response: { status: 401 }
        }

        mockAxiosInstance.get.mockRejectedValue(mockError)
        mockAxiosInstance.post.mockRejectedValue(mockError)
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
        () => internshipApprovalService.getApprovalStatus(1),
        () => internshipApprovalService.getCommitteeVotingStatus(1),
        () => internshipApprovalService.submitAdvisorApproval(1, true),
        () => internshipApprovalService.submitCommitteeVote(1, 'approve'),
        () => internshipApprovalService.updateApprovalStatus(1, 'c.approved')
      ]

      for (const method of methods) {
        mockAxiosInstance.get.mockRejectedValue(networkError)
        mockAxiosInstance.post.mockRejectedValue(networkError)
        mockAxiosInstance.put.mockRejectedValue(networkError)

        try {
          await method()
        } catch (error: any) {
          expect(error.message).toContain('Network Error')
        }
      }
    })
  })

  describe('parameter validation', () => {
    it('accepts valid student enrollment IDs', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} })

      await internshipApprovalService.getApprovalStatus(1)
      await internshipApprovalService.getApprovalStatus(999999)

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2)
    })

    it('accepts valid approval decisions', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitAdvisorApproval(1, true)
      await internshipApprovalService.submitAdvisorApproval(1, false)

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2)
    })

    it('accepts valid vote options', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} })

      await internshipApprovalService.submitCommitteeVote(1, 'approve')
      await internshipApprovalService.submitCommitteeVote(1, 'reject')

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2)
    })

    it('accepts valid status values', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} })

      const validStatuses: InternshipApprovalStatus[] = [
        'registered', 't.approved', 'c.approved', 'doc.approved', 'doc.cancel'
      ]

      for (const status of validStatuses) {
        await internshipApprovalService.updateApprovalStatus(1, status)
      }

      expect(mockAxiosInstance.put).toHaveBeenCalledTimes(validStatuses.length)
    })
  })
})