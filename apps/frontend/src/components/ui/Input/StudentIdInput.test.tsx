import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentIdInput } from './StudentIdInput';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock timers for debounced validation
jest.useFakeTimers();

describe('StudentIdInput Component', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders with default props', () => {
    render(<StudentIdInput />);
    const input = screen.getByPlaceholderText('รหัสนักศึกษา (8-10 หลัก)');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });

  it('renders with custom label and placeholder', () => {
    render(
      <StudentIdInput 
        label="Student ID" 
        placeholder="Enter your student ID"
      />
    );
    
    expect(screen.getByText('Student ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your student ID')).toBeInTheDocument();
  });

  it('filters non-numeric input', () => {
    const onChange = jest.fn();
    render(<StudentIdInput onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'abc123def456' } });
    
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: '123456'
        })
      })
    );
  });

  it('limits input to max digits', () => {
    const onChange = jest.fn();
    render(<StudentIdInput maxDigits={8} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '123456789012' } });
    
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: '12345678'
        })
      })
    );
  });

  it('validates required field', async () => {
    render(<StudentIdInput />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur without entering text
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกรหัสนักศึกษา')).toBeInTheDocument();
    });
  });

  it('validates digit length', async () => {
    render(<StudentIdInput minDigits={8} maxDigits={10} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter short student ID
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12345' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก')).toBeInTheDocument();
    });
    
    // Enter valid student ID
    fireEvent.change(input, { target: { value: '12345678' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.queryByText('รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก')).not.toBeInTheDocument();
    });
  });

  it('formats student ID when enabled', () => {
    render(<StudentIdInput allowFormatting={true} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '123456789' } });
    
    expect(input.value).toBe('12345-6789');
  });

  it('applies custom format pattern', () => {
    render(<StudentIdInput allowFormatting={true} formatPattern="##-###-###" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '12345678' } });
    
    expect(input.value).toBe('12-345-678');
  });

  it('does not format when formatting is disabled', () => {
    render(<StudentIdInput allowFormatting={false} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '123456789' } });
    
    expect(input.value).toBe('123456789');
  });

  it('handles external value changes', () => {
    const { rerender } = render(<StudentIdInput value="12345678" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('12345678');
    
    rerender(<StudentIdInput value="87654321" allowFormatting={true} />);
    expect(input.value).toBe('87654-321');
  });

  it('includes additional validation rules', async () => {
    const additionalRules = [
      {
        custom: (value: string) => !value.startsWith('00'),
        message: 'Student ID cannot start with 00'
      }
    ];
    
    render(<StudentIdInput additionalValidationRules={additionalRules} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter invalid student ID
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '00123456' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('Student ID cannot start with 00')).toBeInTheDocument();
    });
  });

  it('has proper autocomplete attribute', () => {
    render(<StudentIdInput />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });

  it('supports custom autocomplete', () => {
    render(<StudentIdInput autoComplete="off" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('shows validation icon for valid input', async () => {
    render(<StudentIdInput value="12345678" />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    await waitFor(() => {
      const container = input.parentElement;
      const successIcon = container?.querySelector('svg');
      expect(successIcon).toBeInTheDocument();
    });
  });

  it('maintains focus behavior', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<StudentIdInput onFocus={onFocus} onBlur={onBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });
});