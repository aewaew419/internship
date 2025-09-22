import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Input Component', () => {
  const user = userEvent.setup();

  describe('Basic Rendering', () => {
    it('renders input with default props', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with label', () => {
      render(<Input label="Test Label" />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text here" />);
      
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input helperText="This is helper text" />);
      
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });
  });

  describe('Mobile-First Design', () => {
    it('has minimum touch target height for medium size', () => {
      render(<Input size="md" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[44px]'); // iOS minimum touch target
    });

    it('has larger touch target for large size', () => {
      render(<Input size="lg" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[48px]');
    });

    it('has touch-manipulation class for better touch response', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('touch-manipulation');
    });

    it('uses text-base for medium size to prevent iOS zoom', () => {
      render(<Input size="md" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('text-base'); // Prevents zoom on iOS
    });

    it('applies full width when specified', () => {
      render(<Input fullWidth />);
      
      const container = screen.getByRole('textbox').closest('div');
      expect(container).toHaveClass('w-full');
    });
  });

  describe('Input Variants', () => {
    it('applies default variant styles', () => {
      render(<Input variant="default" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border', 'border-gray-300', 'bg-white');
    });

    it('applies filled variant styles', () => {
      render(<Input variant="filled" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-0', 'bg-gray-100');
    });

    it('applies outlined variant styles', () => {
      render(<Input variant="outlined" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-2', 'border-gray-300', 'bg-transparent');
    });
  });

  describe('Input Sizes', () => {
    it('applies small size classes', () => {
      render(<Input size="sm" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-9', 'px-3', 'text-sm', 'min-h-[36px]');
    });

    it('applies medium size classes', () => {
      render(<Input size="md" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10', 'px-3', 'py-2', 'text-base', 'min-h-[44px]');
    });

    it('applies large size classes', () => {
      render(<Input size="lg" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12', 'px-4', 'py-3', 'text-lg', 'min-h-[48px]');
    });
  });

  describe('Focus States', () => {
    it('shows focus ring when focused', async () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      await waitFor(() => {
        expect(input).toHaveClass('ring-2', 'ring-primary-500', 'ring-offset-2');
      });
    });

    it('removes focus ring when blurred', async () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Move focus away
      
      await waitFor(() => {
        expect(input).not.toHaveClass('ring-2', 'ring-primary-500', 'ring-offset-2');
      });
    });

    it('calls onFocus and onBlur handlers', async () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      
      render(<Input onFocus={onFocus} onBlur={onBlur} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(onFocus).toHaveBeenCalled();
      
      await user.tab();
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Error States', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styles to input', () => {
      render(<Input error="Error message" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('applies error styles to label', () => {
      render(<Input label="Test Label" error="Error message" />);
      
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('text-red-600');
    });

    it('shows error icon', () => {
      render(<Input error="Error message" />);
      
      const errorIcon = document.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });

    it('prioritizes error over helper text', () => {
      render(<Input error="Error message" helperText="Helper text" />);
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders left icon', () => {
      const leftIcon = <span data-testid="left-icon">🔍</span>;
      render(<Input leftIcon={leftIcon} />);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      const rightIcon = <span data-testid="right-icon">✓</span>;
      render(<Input rightIcon={rightIcon} />);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('adjusts padding for left icon', () => {
      const leftIcon = <span>🔍</span>;
      render(<Input leftIcon={leftIcon} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('adjusts padding for right icon', () => {
      const rightIcon = <span>✓</span>;
      render(<Input rightIcon={rightIcon} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-10');
    });
  });

  describe('Password Toggle', () => {
    it('renders password toggle button for password input', () => {
      render(<Input type="password" showPasswordToggle />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      render(<Input type="password" showPasswordToggle />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      const toggleButton = screen.getByRole('button');
      
      // Initially should be password type
      expect(input.type).toBe('password');
      
      // Click to show password
      await user.click(toggleButton);
      expect(input.type).toBe('text');
      
      // Click to hide password
      await user.click(toggleButton);
      expect(input.type).toBe('password');
    });

    it('shows correct icon for password visibility state', async () => {
      render(<Input type="password" showPasswordToggle />);
      
      const toggleButton = screen.getByRole('button');
      
      // Initially should show "show password" icon (eye)
      let eyeIcon = toggleButton.querySelector('path[d*="M15 12a3 3 0 11-6 0 3 3 0 016 0z"]');
      expect(eyeIcon).toBeInTheDocument();
      
      // After clicking, should show "hide password" icon (eye-off)
      await user.click(toggleButton);
      
      let eyeOffIcon = toggleButton.querySelector('path[d*="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7"]');
      expect(eyeOffIcon).toBeInTheDocument();
    });

    it('does not show toggle for non-password inputs', () => {
      render(<Input type="text" showPasswordToggle />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
      expect(input).toBeDisabled();
    });

    it('applies disabled styles to label', () => {
      render(<Input label="Test Label" disabled />);
      
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');
      
      expect(input).toHaveAccessibleName('Test Label');
    });

    it('provides accessible error messages', () => {
      render(<Input error="This field is required" aria-describedby="error-message" />);
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('This field is required');
      
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('password toggle button has proper tabindex', () => {
      render(<Input type="password" showPasswordToggle />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch events properly', async () => {
      const onChange = jest.fn();
      render(<Input onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      
      // Simulate touch typing
      await user.type(input, 'test');
      
      expect(onChange).toHaveBeenCalled();
      expect(input).toHaveValue('test');
    });

    it('maintains focus during touch interactions', async () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      // Touch and hold
      fireEvent.touchStart(input);
      fireEvent.touchEnd(input);
      
      // Should maintain focus
      expect(input).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to different screen sizes through CSS classes', () => {
      render(<Input className="sm:text-sm md:text-base lg:text-lg" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('sm:text-sm', 'md:text-base', 'lg:text-lg');
    });

    it('maintains proper spacing on mobile', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-3', 'py-2'); // Adequate touch spacing
    });
  });

  describe('Form Integration', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('passes through HTML input attributes', () => {
      render(<Input name="test-input" required maxLength={10} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'test-input');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('handles controlled input', async () => {
      const onChange = jest.fn();
      const { rerender } = render(<Input value="initial" onChange={onChange} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('initial');
      
      await user.type(input, 'a');
      expect(onChange).toHaveBeenCalled();
      
      // Simulate parent component updating value
      rerender(<Input value="updated" onChange={onChange} />);
      expect(input.value).toBe('updated');
    });
  });
});