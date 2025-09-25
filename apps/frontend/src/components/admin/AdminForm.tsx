"use client";

import { ReactNode } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";

export interface AdminFormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "date";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  className?: string;
  children?: ReactNode;
}

export interface AdminFormProps {
  onSubmit: (data: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  validationErrors?: Record<string, string>;
}

export const AdminFormField = ({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  options = [],
  rows = 3,
  className = "",
  children,
}: AdminFormFieldProps) => {
  const baseInputClasses = `block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
    error ? "border-red-300" : ""
  } ${disabled ? "bg-gray-50 text-gray-500" : ""}`;

  const renderInput = () => {
    if (children) {
      return children;
    }

    switch (type) {
      case "textarea":
        return (
          <textarea
            name={name}
            id={name}
            rows={rows}
            className={baseInputClasses}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        );

      case "select":
        return (
          <select
            name={name}
            id={name}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={name}
              id={name}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              disabled={disabled}
            />
            <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type={type}
            name={name}
            id={name}
            className={baseInputClasses}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        );
    }
  };

  if (type === "checkbox") {
    return (
      <div className={`${className}`}>
        {renderInput()}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export const AdminForm = ({
  onSubmit,
  children,
  className = "",
  validationErrors,
}: AdminFormProps) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit(formData);
  };

  return (
    <div className={className}>
      {validationErrors && Object.keys(validationErrors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {children}
      </form>
    </div>
  );
};

export const AdminFormActions = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex justify-end space-x-3 pt-6 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const AdminFormButton = ({
  type = "button",
  variant = "secondary",
  loading = false,
  disabled = false,
  onClick,
  children,
  className = "",
}: {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) => {
  const baseClasses = "inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    secondary: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-red-500",
    danger: "border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};