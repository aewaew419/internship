import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EvaluationStatus from '../EvaluationStatus'

describe('EvaluationStatus Component', () => {
  it('renders nothing when isEvaluated is false', () => {
    const { container } = render(
      <EvaluationStatus isEvaluated={false} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders evaluation status when isEvaluated is true', () => {
    render(
      <EvaluationStatus isEvaluated={true} />
    )
    
    expect(screen.getByText('ประเมินแล้ว')).toBeInTheDocument()
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument()
  })

  it('displays timestamp when showTimestamp is true and evaluationDate is provided', () => {
    const testDate = '2024-01-15T10:30:00Z'
    
    render(
      <EvaluationStatus 
        isEvaluated={true} 
        evaluationDate={testDate}
        showTimestamp={true}
      />
    )
    
    expect(screen.getByText('ประเมินแล้ว')).toBeInTheDocument()
    expect(screen.getByText('15/01/2024 10:30')).toBeInTheDocument()
  })

  it('does not display timestamp when showTimestamp is false', () => {
    const testDate = '2024-01-15T10:30:00Z'
    
    render(
      <EvaluationStatus 
        isEvaluated={true} 
        evaluationDate={testDate}
        showTimestamp={false}
      />
    )
    
    expect(screen.getByText('ประเมินแล้ว')).toBeInTheDocument()
    expect(screen.queryByText('15/01/2024 10:30')).not.toBeInTheDocument()
  })

  it('does not display timestamp when evaluationDate is not provided', () => {
    render(
      <EvaluationStatus 
        isEvaluated={true} 
        showTimestamp={true}
      />
    )
    
    expect(screen.getByText('ประเมินแล้ว')).toBeInTheDocument()
    expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).not.toBeInTheDocument()
  })

  it('applies custom className correctly', () => {
    const { container } = render(
      <EvaluationStatus 
        isEvaluated={true} 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles Date object as evaluationDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z')
    
    render(
      <EvaluationStatus 
        isEvaluated={true} 
        evaluationDate={testDate}
        showTimestamp={true}
      />
    )
    
    expect(screen.getByText('ประเมินแล้ว')).toBeInTheDocument()
    expect(screen.getByText('15/01/2024 10:30')).toBeInTheDocument()
  })

  it('has correct styling attributes', () => {
    render(
      <EvaluationStatus isEvaluated={true} />
    )
    
    const chip = screen.getByText('ประเมินแล้ว').closest('.MuiChip-root')
    expect(chip).toBeInTheDocument()
    
    const icon = screen.getByTestId('CheckCircleIcon')
    expect(icon).toBeInTheDocument()
  })

  it('renders with flex layout when timestamp is shown', () => {
    const testDate = '2024-01-15T10:30:00Z'
    const { container } = render(
      <EvaluationStatus 
        isEvaluated={true} 
        evaluationDate={testDate}
        showTimestamp={true}
      />
    )
    
    expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2')
  })
})