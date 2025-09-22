import type { Meta, StoryObj } from '@storybook/react';
import { Input, Field, FormControl, Select, Textarea, Checkbox } from './index';

const meta: Meta = {
  title: 'UI/Form Components',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

// Input Stories
export const InputVariants: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <h3 className="text-lg font-semibold">Input Variants</h3>
      
      <Input 
        label="Default Input" 
        placeholder="Enter text"
        helperText="This is a default input"
      />
      
      <Input 
        label="Filled Input" 
        variant="filled"
        placeholder="Enter text"
      />
      
      <Input 
        label="Outlined Input" 
        variant="outlined"
        placeholder="Enter text"
      />
      
      <Input 
        label="Input with Error" 
        error="This field is required"
        placeholder="Enter text"
      />
    </div>
  ),
};

export const InputSizes: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Input Sizes</h3>
      
      <Input label="Small" size="sm" placeholder="Small input" />
      <Input label="Medium" size="md" placeholder="Medium input" />
      <Input label="Large" size="lg" placeholder="Large input" />
    </div>
  ),
};

export const InputWithIcons: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Input with Icons</h3>
      
      <Input 
        label="Email"
        placeholder="Enter email"
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
      
      <Input 
        label="Search"
        placeholder="Search..."
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      
      <Input 
        label="Password"
        type="password"
        placeholder="Enter password"
        showPasswordToggle
      />
    </div>
  ),
};

export const SelectComponent: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Select Component</h3>
      
      <Select
        label="Country"
        placeholder="Select country"
        options={[
          { value: 'th', label: 'Thailand' },
          { value: 'us', label: 'United States' },
          { value: 'jp', label: 'Japan' },
          { value: 'uk', label: 'United Kingdom' },
        ]}
      />
      
      <Select
        label="Priority"
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent', disabled: true },
        ]}
        error="Please select a priority"
      />
    </div>
  ),
};

export const TextareaComponent: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Textarea Component</h3>
      
      <Textarea
        label="Description"
        placeholder="Enter description..."
        helperText="Provide a detailed description"
      />
      
      <Textarea
        label="Auto-resize Textarea"
        placeholder="Type here and watch it grow..."
        autoResize
        rows={2}
      />
      
      <Textarea
        label="Comments"
        placeholder="Enter comments..."
        error="Comments are required"
      />
    </div>
  ),
};

export const CheckboxComponent: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Checkbox Component</h3>
      
      <Checkbox label="Accept terms and conditions" />
      
      <Checkbox 
        label="Subscribe to newsletter" 
        helperText="Get updates about new features"
      />
      
      <Checkbox 
        label="Premium Plan" 
        helperText="Includes all premium features"
        variant="card"
      />
      
      <Checkbox 
        label="Required field" 
        error="This field is required"
      />
    </div>
  ),
};

export const FormControlComponent: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-semibold">Form Control Layouts</h3>
      
      <FormControl
        label="Vertical Layout"
        helperText="This is the default vertical layout"
      >
        <Input placeholder="Enter value" />
      </FormControl>
      
      <FormControl
        label="Horizontal Layout"
        orientation="horizontal"
        labelPosition="left"
        helperText="Label is positioned to the left"
      >
        <Input placeholder="Enter value" />
      </FormControl>
      
      <FormControl
        label="Required Field"
        required
        error="This field is required"
      >
        <Input placeholder="Enter value" />
      </FormControl>
    </div>
  ),
};

export const MobileFormShowcase: StoryObj = {
  render: () => (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      <h3 className="text-lg font-semibold mb-4">Mobile-Optimized Form</h3>
      
      <Input 
        label="Full Name"
        placeholder="Enter your full name"
        fullWidth
        size="lg"
      />
      
      <Input 
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        fullWidth
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
      
      <Input 
        label="Password"
        type="password"
        placeholder="Create a password"
        fullWidth
        showPasswordToggle
        helperText="Must be at least 8 characters"
      />
      
      <Select
        label="Country"
        placeholder="Select your country"
        fullWidth
        options={[
          { value: 'th', label: 'Thailand' },
          { value: 'us', label: 'United States' },
          { value: 'jp', label: 'Japan' },
        ]}
      />
      
      <Textarea
        label="Bio"
        placeholder="Tell us about yourself..."
        fullWidth
        autoResize
        rows={3}
      />
      
      <Checkbox 
        label="I agree to the Terms of Service and Privacy Policy"
        variant="card"
      />
      
      <div className="pt-4">
        <button className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium min-h-[48px] touch-manipulation">
          Create Account
        </button>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};