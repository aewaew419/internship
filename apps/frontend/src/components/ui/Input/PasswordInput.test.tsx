import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordInput } from './PasswordInput';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock timers for debounced validation
jest.useFakeTimers();

describe('PasswordInput Component', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders with default props', () => {
    render(<PasswordInput />);
    const input = screen.getByPlaceholderText('รหัสผ่าน');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with custom label and placeholder', () => {
    render(
      <PasswordInput 
        label="Password" 
        placeholder="Enter your password"
      />
    );
    
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<PasswordInput showPasswordToggle={true} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const toggleButton = screen.getByRole('button');
    
    expect(input.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('password');
  });

  it('does not show toggle when disabled', () => {
    render(<PasswordInput showPasswordToggle={false} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('validates required field', async () => {
    render(<PasswordInput />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur without entering text
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกรหัสผ่าน')).toBeInTheDocument();
    });
  });

  it('validates minimum length', async () => {
    render(<PasswordInput minLength={8} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter short password
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '123' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')).toBeInTheDocument();
    });
  });

  it('validates uppercase requirement', async () => {
    render(<PasswordInput requireUppercase={true} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter password without uppercase
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'password123' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่')).toBeInTheDocument();
    });
  });

  it('validates lowercase requirement', async () => {
    render(<PasswordInput requireLowercase={true} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter password without lowercase
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'PASSWORD123' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รหัsผ่านต้องมีตัวอักษรพิมพ์เล็ก')).toBeInTheDocument();
    });
  });

  it('validates numbers requirement', async () => {
    render(<PasswordInput requireNumbers={true} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter password without numbers
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Password' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านต้องมีตัวเลข')).toBeInTheDocument();
    });
  });

  it('validates special characters requirement', async () => {
    render(<PasswordInput requireSpecialChars={true} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter password without special characters
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Password123' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านต้องมีอักขระพิเศษ')).toBeInTheDocument();
    });
  });

  describe('Password Strength Indicator', () => {
    it('shows strength indicator by default', () => {
      render(<PasswordInput value="test" />);
      
      // Should show strength bar
      expect(screen.getByRole('textbox').parentElement?.parentElement?.querySelector('.bg-gray-200')).toBeInTheDocument();
    });

    it('does not show strength indicator when disabled', () => {
      render(<PasswordInput showStrengthIndicator={false} value="test" />);
      
      // Should not show strength bar
      expect(screen.getByRole('textbox').parentElement?.parentElement?.querySelector('.bg-gray-200')).not.toBeInTheDocument();
    });

    it('calculates strength correctly for weak password', () => {
      render(<PasswordInput value="123" />);
      
      expect(screen.getByText('อ่อนแอ')).toBeInTheDocument();
    });

    it('calculates strength correctly for strong password', () => {
      render(
        <PasswordInput 
          value="StrongPassword123!" 
          requireUppercase={true}
          requireLowercase={true}
          requireNumbers={true}
          requireSpecialChars={true}
        />
      );
      
      expect(screen.getByText('แข็งแรงมาก')).toBeInTheDocument();
    });

    it('shows feedback messages for missing requirements', () => {
      render(
        <PasswordInput 
          value="weak" 
          minLength={8}
          requireUppercase={true}
          requireNumbers={true}
        />
      );
      
      expect(screen.getByText('ต้องมีอย่างน้อย 8 ตัวอักษร')).toBeInTheDocument();
      expect(screen.getByText('ต้องมีตัวอักษรพิมพ์ใหญ่')).toBeInTheDocument();
      expect(screen.getByText('ต้องมีตัวเลข')).toBeInTheDocument();
    });

    it('calls onStrengthChange callback', () => {
      const onStrengthChange = jest.fn();
      
      render(
        <PasswordInput 
          value="TestPassword123" 
          onStrengthChange={onStrengthChange}
        />
      );
      
      expect(onStrengthChange).toHaveBeenCalledWith(
        expect.objectContaining({
          score: expect.any(Number),
          feedback: expect.any(Array),
          color: expect.any(String),
          label: expect.any(String)
        })
      );
    });

    it('uses custom strength calculator when provided', () => {
      const customCalculator = jest.fn().mockReturnValue({
        score: 4,
        feedback: [],
        color: 'green',
        label: 'Custom Strong'
      });
      
      render(
        <PasswordInput 
          value="test" 
          customStrengthCalculator={customCalculator}
        />
      );
      
      expect(customCalculator).toHaveBeenCalledWith('test');
      expect(screen.getByText('Custom Strong')).toBeInTheDocument();
    });
  });

  it('includes additional validation rules', async () => {
    const additionalRules = [
      {
        custom: (value: string) => !value.includes('password'),
        message: 'Password cannot contain the word "password"'
      }
    ];
    
    render(<PasswordInput additionalValidationRules={additionalRules} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter invalid password
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'mypassword123' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('Password cannot contain the word "password"')).toBeInTheDocument();
    });
  });

  it('has proper autocomplete attribute', () => {
    render(<PasswordInput />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
  });

  it('supports custom autocomplete', () => {
    render(<PasswordInput autoComplete="new-password" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
  });

  it('maintains focus behavior', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<PasswordInput onFocus={onFocus} onBlur={onBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  it('handles external value changes', () => {
    const { rerender } = render(<PasswordInput value="initial" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('initial');
    
    rerender(<PasswordInput value="updated" />);
    expect(input.value).toBe('updated');
  });
});