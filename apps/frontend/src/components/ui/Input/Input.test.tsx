import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('text-base'); // Prevents zoom on iOS
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('shows helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Input variant="filled" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-gray-100');

    rerender(<Input variant="outlined" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-2');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-9');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
  });

  it('renders with left icon', () => {
    const icon = <span data-testid="left-icon">📧</span>;
    render(<Input leftIcon={icon} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    const icon = <span data-testid="right-icon">🔍</span>;
    render(<Input rightIcon={icon} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('pr-10');
  });

  it('handles password toggle', () => {
    render(<Input type="password" showPasswordToggle />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const toggleButton = screen.getByRole('button');

    expect(input.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('password');
  });

  it('handles focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<Input onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  it('renders full width', () => {
    render(<Input fullWidth />);
    expect(screen.getByRole('textbox').parentElement?.parentElement).toHaveClass('w-full');
  });

  it('has proper mobile touch targets', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[36px]');

    rerender(<Input size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[44px]');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[48px]');
  });

  it('includes mobile-friendly classes', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('touch-manipulation');
    expect(input).toHaveClass('text-base'); // Prevents zoom on iOS
  });
});