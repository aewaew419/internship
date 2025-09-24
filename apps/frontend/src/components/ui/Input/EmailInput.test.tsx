import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailInput } from './EmailInput';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock timers for debounced validation
jest.useFakeTimers();

describe('EmailInput Component', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders with default props', () => {
    render(<EmailInput />);
    const input = screen.getByPlaceholderText('อีเมล');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('inputmode', 'email');
  });

  it('renders with custom label and placeholder', () => {
    render(
      <EmailInput 
        label="Email Address" 
        placeholder="Enter your email"
      />
    );
    
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('validates required field', async () => {
    render(<EmailInput />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur without entering text
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกอีเมล')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<EmailInput />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter invalid email
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument();
    });
    
    // Enter valid email
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.queryByText('รูปแบบอีเมลไม่ถูกต้อง')).not.toBeInTheDocument();
    });
  });

  it('validates email structure (consecutive dots)', async () => {
    render(<EmailInput />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter email with consecutive dots
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test..email@example.com' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument();
    });
  });

  it('validates local part length and format', async () => {
    render(<EmailInput />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter email with invalid local part (starts with dot)
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '.test@example.com' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument();
    });
  });

  describe('Email Suggestions', () => {
    it('shows suggestions when typing domain', async () => {
      render(<EmailInput showSuggestions={true} />);
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test@gm' } });
      
      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
      });
    });

    it('shows custom domain suggestions', async () => {
      const customDomains = ['company.com', 'organization.org'];
      
      render(
        <EmailInput 
          showSuggestions={true} 
          commonDomains={customDomains}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'user@comp' } });
      
      await waitFor(() => {
        expect(screen.getByText('user@company.com')).toBeInTheDocument();
      });
    });

    it('selects suggestion when clicked', async () => {
      const onChange = jest.fn();
      const onSuggestionSelect = jest.fn();
      
      render(
        <EmailInput 
          showSuggestions={true}
          onChange={onChange}
          onSuggestionSelect={onSuggestionSelect}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test@gm' } });
      
      await waitFor(() => {
        const suggestion = screen.getByText('test@gmail.com');
        fireEvent.click(suggestion);
      });
      
      expect(onSuggestionSelect).toHaveBeenCalledWith('test@gmail.com');
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'test@gmail.com'
          })
        })
      );
    });

    it('hides suggestions on blur', async () => {
      render(<EmailInput showSuggestions={true} />);
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test@gm' } });
      
      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
      });
      
      fireEvent.blur(input);
      
      // Wait for the timeout in handleBlur
      jest.advanceTimersByTime(200);
      
      await waitFor(() => {
        expect(screen.queryByText('test@gmail.com')).not.toBeInTheDocument();
      });
    });

    it('shows suggestions on focus if applicable', async () => {
      render(<EmailInput showSuggestions={true} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      // Set initial value
      fireEvent.change(input, { target: { value: 'test@gm' } });
      
      // Focus should show suggestions
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
      });
    });

    it('does not show suggestions when disabled', () => {
      render(<EmailInput showSuggestions={false} />);
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test@gm' } });
      
      expect(screen.queryByText('test@gmail.com')).not.toBeInTheDocument();
    });

    it('limits suggestions to 5 items', async () => {
      const manyDomains = [
        'domain1.com', 'domain2.com', 'domain3.com', 
        'domain4.com', 'domain5.com', 'domain6.com', 
        'domain7.com', 'domain8.com'
      ];
      
      render(
        <EmailInput 
          showSuggestions={true}
          commonDomains={manyDomains}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test@d' } });
      
      await waitFor(() => {
        const suggestions = screen.getAllByText(/test@domain\d\.com/);
        expect(suggestions.length).toBeLessThanOrEqual(5);
      });
    });
  });

  it('includes additional validation rules', async () => {
    const additionalRules = [
      {
        custom: (value: string) => !value.includes('test'),
        message: 'Email cannot contain "test"'
      }
    ];
    
    render(<EmailInput additionalValidationRules={additionalRules} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter invalid email
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('Email cannot contain "test"')).toBeInTheDocument();
    });
  });

  it('supports international domains when enabled', async () => {
    render(<EmailInput allowInternational={true} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter international domain
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'user@münchen.de' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.queryByText('รูปแบบอีเมลไม่ถูกต้อง')).not.toBeInTheDocument();
    });
  });

  it('restricts to ASCII domains when international is disabled', async () => {
    render(<EmailInput allowInternational={false} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus and blur to mark as touched
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    // Enter international domain
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'user@münchen.de' } });
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument();
    });
  });

  it('has proper autocomplete attribute', () => {
    render(<EmailInput />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('supports custom autocomplete', () => {
    render(<EmailInput autoComplete="username" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });

  it('shows email icon', () => {
    render(<EmailInput />);
    
    const input = screen.getByRole('textbox');
    const container = input.parentElement;
    const emailIcon = container?.querySelector('svg');
    
    expect(emailIcon).toBeInTheDocument();
  });

  it('maintains focus behavior', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<EmailInput onFocus={onFocus} onBlur={onBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  it('handles external value changes', () => {
    const { rerender } = render(<EmailInput value="initial@test.com" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('initial@test.com');
    
    rerender(<EmailInput value="updated@test.com" />);
    expect(input.value).toBe('updated@test.com');
  });
});