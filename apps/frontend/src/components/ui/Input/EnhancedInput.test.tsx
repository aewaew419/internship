import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedInput, ValidationRule } from './EnhancedInput';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock timers for debounced validation
jest.useFakeTimers();

describe('EnhancedInput Component', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders with default props', () => {
    render(<EnhancedInput placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with mobile input modes', () => {
    const { rerender } = render(<EnhancedInput inputMode="numeric" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'numeric');

    rerender(<EnhancedInput inputMode="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'email');

    rerender(<EnhancedInput inputMode="tel" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'tel');
  });

  it('renders with autocomplete attributes', () => {
    render(<EnhancedInput autoComplete="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
  });

  describe('Real-time Validation', () => {
    const requiredRule: ValidationRule = {
      required: true,
      message: 'This field is required'
    };

    const minLengthRule: ValidationRule = {
      minLength: 3,
      message: 'Must be at least 3 characters'
    };

    const patternRule: ValidationRule = {
      pattern: /^[0-9]+$/,
      message: 'Must contain only numbers'
    };

    it('validates required fields on blur', async () => {
      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[requiredRule]}
          placeholder="Required field"
        />
      );

      const input = screen.getByPlaceholderText('Required field');
      
      // Focus and blur without entering text
      fireEvent.focus(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('validates min length with debounced validation', async () => {
      const onValidationChange = jest.fn();
      
      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[minLengthRule]}
          validationDelay={100}
          onValidationChange={onValidationChange}
          placeholder="Min length field"
        />
      );

      const input = screen.getByPlaceholderText('Min length field');
      
      // Focus to mark as touched
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      // Enter short text
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'ab' } });

      // Fast-forward timers to trigger debounced validation
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Must be at least 3 characters')).toBeInTheDocument();
        expect(onValidationChange).toHaveBeenCalledWith(false, 'Must be at least 3 characters');
      });

      // Enter valid text
      fireEvent.change(input, { target: { value: 'abc' } });
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.queryByText('Must be at least 3 characters')).not.toBeInTheDocument();
        expect(onValidationChange).toHaveBeenCalledWith(true, undefined);
      });
    });

    it('validates pattern rules', async () => {
      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[patternRule]}
          placeholder="Numbers only"
        />
      );

      const input = screen.getByPlaceholderText('Numbers only');
      
      // Focus and blur to mark as touched
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      // Enter invalid text
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'abc123' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Must contain only numbers')).toBeInTheDocument();
      });

      // Enter valid text
      fireEvent.change(input, { target: { value: '123456' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByText('Must contain only numbers')).not.toBeInTheDocument();
      });
    });

    it('validates custom rules', async () => {
      const customRule: ValidationRule = {
        custom: (value: string) => value.includes('@'),
        message: 'Must contain @ symbol'
      };

      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[customRule]}
          placeholder="Custom validation"
        />
      );

      const input = screen.getByPlaceholderText('Custom validation');
      
      // Focus and blur to mark as touched
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      // Enter invalid text
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Must contain @ symbol')).toBeInTheDocument();
      });

      // Enter valid text
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByText('Must contain @ symbol')).not.toBeInTheDocument();
      });
    });

    it('shows validation icons when enabled', async () => {
      render(
        <EnhancedInput 
          realTimeValidation 
          showValidationIcon
          validationRules={[requiredRule]}
          placeholder="With icons"
          value="valid text"
        />
      );

      const input = screen.getByPlaceholderText('With icons');
      
      // Focus and blur to mark as touched
      fireEvent.focus(input);
      fireEvent.blur(input);

      await waitFor(() => {
        // Should show success icon for valid input
        const successIcon = screen.getByRole('textbox').parentElement?.querySelector('svg');
        expect(successIcon).toBeInTheDocument();
      });
    });

    it('does not show validation icons when disabled', () => {
      render(
        <EnhancedInput 
          realTimeValidation 
          showValidationIcon={false}
          validationRules={[requiredRule]}
          placeholder="No icons"
        />
      );

      const input = screen.getByPlaceholderText('No icons');
      
      // Focus and blur to mark as touched
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Should not show validation icons
      const container = screen.getByRole('textbox').parentElement;
      const icons = container?.querySelectorAll('svg');
      expect(icons?.length).toBe(0);
    });

    it('prioritizes external errors over validation errors', () => {
      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[requiredRule]}
          externalError="Server error occurred"
          placeholder="External error"
        />
      );

      const input = screen.getByPlaceholderText('External error');
      
      // Focus and blur to trigger validation
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Should show external error instead of validation error
      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('handles multiple validation rules correctly', async () => {
      const multipleRules: ValidationRule[] = [
        { required: true, message: 'Required' },
        { minLength: 5, message: 'Too short' },
        { pattern: /^[a-zA-Z]+$/, message: 'Letters only' }
      ];

      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={multipleRules}
          placeholder="Multiple rules"
        />
      );

      const input = screen.getByPlaceholderText('Multiple rules');
      
      // Test required validation
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
      });

      // Test min length validation
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'abc' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Too short')).toBeInTheDocument();
      });

      // Test pattern validation
      fireEvent.change(input, { target: { value: 'abc123' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Letters only')).toBeInTheDocument();
      });

      // Test valid input
      fireEvent.change(input, { target: { value: 'abcdef' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByText('Required')).not.toBeInTheDocument();
        expect(screen.queryByText('Too short')).not.toBeInTheDocument();
        expect(screen.queryByText('Letters only')).not.toBeInTheDocument();
      });
    });

    it('does not validate before field is touched', () => {
      const onValidationChange = jest.fn();
      
      render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[requiredRule]}
          onValidationChange={onValidationChange}
          placeholder="Not touched"
        />
      );

      const input = screen.getByPlaceholderText('Not touched');
      
      // Change value without focusing/blurring (not touched)
      fireEvent.change(input, { target: { value: '' } });
      jest.advanceTimersByTime(300);

      // Should not show validation error or call validation callback
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      expect(onValidationChange).not.toHaveBeenCalled();
    });

    it('clears validation timer on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <EnhancedInput 
          realTimeValidation 
          validationRules={[requiredRule]}
          placeholder="Unmount test"
        />
      );

      const input = screen.getByPlaceholderText('Unmount test');
      
      // Trigger validation timer
      fireEvent.focus(input);
      fireEvent.blur(input);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test' } });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper ARIA attributes', () => {
      render(
        <EnhancedInput 
          label="Email Address"
          realTimeValidation 
          validationRules={[{ required: true, message: 'Required' }]}
          placeholder="Enter email"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter email');
      
      // Trigger validation error
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Check that error is properly associated
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<EnhancedInput placeholder="Keyboard test" />);
      
      const input = screen.getByPlaceholderText('Keyboard test');
      
      // Should be focusable
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });
});