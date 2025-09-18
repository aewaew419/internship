import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ApprovalStatusDisplay } from '../ApprovalStatusDisplay'

// Mock the hooks
vi.mock('../../../service/api/internship/hooks/useApprovalStatusViewModel', () => ({
  useApprovalStatusViewModel: () => ({
    status: 'registered',
    statusText: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
    loading: false,
    error: null,
    refreshStatus: vi.fn()
  })
}))

vi.mock('../../../service/api/internship/hooks/useStatusTransitionHandler', () => ({
  useStatusTransitionHandler: () => ({
    handleTransition: vi.fn(),
    isTransitioning: false,
    transitionError: null
  })
}))

describe('ApprovalStatusDisplay', () => {
  it('renders status display correctly', () => {
    render(<ApprovalStatusDisplay studentEnrollId={1} />)
    expect(screen.getByText('อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา')).toBeInTheDocument()
  })
})