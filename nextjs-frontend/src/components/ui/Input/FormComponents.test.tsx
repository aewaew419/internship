import { render, screen, fireEvent } from '@testing-library/react';
import { Field, FormControl, Select, Textarea, Checkbox } from './index';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('Field Component', () => {
  it('renders with validation', () => {
    const errors = { email: 'Email is required' };
    const touched = { email: true };
    
    render(
      <Field 
        name="email" 
        label="Email" 
        errors={errors} 
        touched={touched}
        validation={{ required: true }}
      />
    );
    
    expect(screen.getByText('Email *')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('does not show error when not touched', () => {
    const errors = { email: 'Email is required' };
    const touched = { email: false };
    
    render(
      <Field 
        name="email" 
        label="Email" 
        errors={errors} 
        touched={touched}
      />
    );
    
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });
});

describe('FormControl Component', () => {
  it('renders with label and helper text', () => {
    render(
      <FormControl 
        label="Username" 
        helperText="Choose a unique username"
        required
      >
        <input />
      </FormControl>
    );
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Choose a unique username')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders horizontal layout', () => {
    render(
      <FormControl 
        label="Setting" 
        orientation="horizontal"
        labelPosition="left"
      >
        <input />
      </FormControl>
    );
    
    const container = screen.getByText('Setting').parentElement;
    expect(container).toHaveClass('flex');
  });
});

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  it('renders with options', () => {
    render(<Select options={options} placeholder="Choose option" />);
    
    expect(screen.getByText('Choose option')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('handles selection', () => {
    const onChange = jest.fn();
    render(<Select options={options} onChange={onChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option1' } });
    
    expect(onChange).toHaveBeenCalled();
  });

  it('has proper mobile touch targets', () => {
    render(<Select options={options} size="md" />);
    expect(screen.getByRole('combobox')).toHaveClass('min-h-[44px]');
  });
});

describe('Textarea Component', () => {
  it('renders with label and helper text', () => {
    render(
      <Textarea 
        label="Description" 
        helperText="Provide a detailed description"
        placeholder="Enter description"
      />
    );
    
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Provide a detailed description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles auto-resize', () => {
    render(<Textarea autoResize />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.input(textarea, { target: { value: 'Long text content' } });
    expect(textarea).toHaveClass('overflow-hidden');
  });

  it('has proper mobile minimum height', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[88px]');
  });
});

describe('Checkbox Component', () => {
  it('renders with label', () => {
    render(<Checkbox label="Accept terms and conditions" />);
    
    expect(screen.getByText('Accept terms and conditions')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders card variant', () => {
    render(
      <Checkbox 
        label="Premium Plan" 
        helperText="Includes all features"
        variant="card"
      />
    );
    
    const container = screen.getByText('Premium Plan').closest('div');
    expect(container).toHaveClass('p-4');
    expect(screen.getByText('Includes all features')).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Checkbox size="sm" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-4');

    rerender(<Checkbox size="lg" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-6');
  });

  it('shows error message', () => {
    render(<Checkbox label="Terms" error="You must accept the terms" />);
    expect(screen.getByText('You must accept the terms')).toBeInTheDocument();
  });

  it('has mobile-friendly touch targets', () => {
    render(<Checkbox label="Test" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('touch-manipulation');
    expect(checkbox).toHaveClass('cursor-pointer');
  });
});