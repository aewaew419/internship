import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Simple Button component for testing
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  size = 'md',
  variant = 'primary',
  className = ''
}: ButtonProps) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm min-h-[32px]',
    md: 'h-10 px-4 text-base min-h-[44px]', // iOS minimum touch target
    lg: 'h-12 px-6 text-lg min-h-[48px]',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
        rounded-lg font-medium transition-colors
        touch-manipulation
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </button>
  );
};

describe('Button Component', () => {
  const user = userEvent.setup();

  describe('Basic Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Mobile-First Design', () => {
    it('has minimum touch target height for medium size', () => {
      render(<Button size="md">Medium Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]'); // iOS minimum touch target
    });

    it('has larger touch target for large size', () => {
      render(<Button size="lg">Large Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[48px]');
    });

    it('has touch-manipulation class for better touch response', () => {
      render(<Button>Touch Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-manipulation');
    });

    it('applies proper padding for touch targets', () => {
      render(<Button size="md">Medium Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4'); // Adequate horizontal padding
    });
  });

  describe('Button Sizes', () => {
    it('applies small size classes', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3', 'text-sm', 'min-h-[32px]');
    });

    it('applies medium size classes', () => {
      render(<Button size="md">Medium</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'text-base', 'min-h-[44px]');
    });

    it('applies large size classes', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-6', 'text-lg', 'min-h-[48px]');
    });
  });

  describe('Button Variants', () => {
    it('applies primary variant styles', () => {
      render(<Button variant="primary">Primary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200', 'text-gray-900');
    });
  });

  describe('Focus States', () => {
    it('has proper focus ring styles', () => {
      render(<Button>Focus me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2');
    });

    it('can receive focus', async () => {
      render(<Button>Focus me</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Simulate Enter key press
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('supports space key activation', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Space Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Simulate Space key press
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch events properly', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Touch Button</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate touch tap
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('provides visual feedback on interaction', () => {
      render(<Button>Interactive Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors'); // Smooth transitions
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('maintains base classes with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg', 'font-medium', 'custom-class');
    });
  });
});