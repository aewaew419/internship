'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DateValidationSystem,
  ValidationResult,
  DateConflict,
  Semester,
  Holiday,
  BusinessRules,
  DEFAULT_BUSINESS_RULES,
  dateValidationSystem
} from '@/lib/validation/dateValidation';

interface UseDateValidationOptions {
  businessRules?: Partial<BusinessRules>;
  autoValidate?: boolean;
  debounceMs?: number;
}

interface UseDateValidationReturn {
  // Validation functions
  validateSemester: (semester: Semester, existingSemesters?: Semester[]) => ValidationResult;
  validateHoliday: (holiday: Holiday, semesters?: Semester[], existingHolidays?: Holiday[]) => ValidationResult;
  validateAcademicCalendar: (semesters: Semester[], holidays: Holiday[]) => ValidationResult;
  
  // State
  validationResult: ValidationResult | null;
  isValidating: boolean;
  
  // Conflict management
  conflicts: DateConflict[];
  errors: DateConflict[];
  warnings: DateConflict[];
  hasErrors: boolean;
  hasWarnings: boolean;
  
  // Actions
  clearValidation: () => void;
  resolveConflict: (conflict: DateConflict, resolution: string) => void;
  updateBusinessRules: (rules: Partial<BusinessRules>) => void;
  
  // Utilities
  getConflictsByEntity: (entityName: string) => DateConflict[];
  getConflictsByType: (type: DateConflict['type']) => DateConflict[];
  getSuggestions: (conflict: DateConflict) => string[];
}

export const useDateValidation = (options: UseDateValidationOptions = {}): UseDateValidationReturn => {
  const {
    businessRules = {},
    autoValidate = true,
    debounceMs = 300
  } = options;

  // State
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSystem] = useState(() => {
    const system = new DateValidationSystem({ ...DEFAULT_BUSINESS_RULES, ...businessRules });
    return system;
  });

  // Debounced validation
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Memoized conflict data
  const conflictData = useMemo(() => {
    if (!validationResult) {
      return {
        conflicts: [],
        errors: [],
        warnings: [],
        hasErrors: false,
        hasWarnings: false,
      };
    }

    return {
      conflicts: validationResult.conflicts,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      hasErrors: validationResult.errors.length > 0,
      hasWarnings: validationResult.warnings.length > 0,
    };
  }, [validationResult]);

  // Validation functions with debouncing
  const performValidation = useCallback((
    validationFn: () => ValidationResult,
    immediate = false
  ) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const executeValidation = () => {
      setIsValidating(true);
      try {
        const result = validationFn();
        setValidationResult(result);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult({
          isValid: false,
          conflicts: [],
          errors: [],
          warnings: [],
        });
      } finally {
        setIsValidating(false);
      }
    };

    if (immediate || !autoValidate) {
      executeValidation();
    } else {
      const timeout = setTimeout(executeValidation, debounceMs);
      setValidationTimeout(timeout);
    }
  }, [validationTimeout, autoValidate, debounceMs]);

  // Validate semester
  const validateSemester = useCallback((
    semester: Semester, 
    existingSemesters: Semester[] = []
  ): ValidationResult => {
    const result = validationSystem.validateSemester(semester, existingSemesters);
    
    if (autoValidate) {
      performValidation(() => result, true);
    }
    
    return result;
  }, [validationSystem, autoValidate, performValidation]);

  // Validate holiday
  const validateHoliday = useCallback((
    holiday: Holiday, 
    semesters: Semester[] = [], 
    existingHolidays: Holiday[] = []
  ): ValidationResult => {
    const result = validationSystem.validateHoliday(holiday, semesters, existingHolidays);
    
    if (autoValidate) {
      performValidation(() => result, true);
    }
    
    return result;
  }, [validationSystem, autoValidate, performValidation]);

  // Validate entire academic calendar
  const validateAcademicCalendar = useCallback((
    semesters: Semester[], 
    holidays: Holiday[]
  ): ValidationResult => {
    const result = validationSystem.validateAcademicCalendar(semesters, holidays);
    
    if (autoValidate) {
      performValidation(() => result, true);
    }
    
    return result;
  }, [validationSystem, autoValidate, performValidation]);

  // Clear validation results
  const clearValidation = useCallback(() => {
    setValidationResult(null);
    if (validationTimeout) {
      clearTimeout(validationTimeout);
      setValidationTimeout(null);
    }
  }, [validationTimeout]);

  // Resolve conflict (placeholder for future implementation)
  const resolveConflict = useCallback((conflict: DateConflict, resolution: string) => {
    console.log('Resolving conflict:', conflict, 'with resolution:', resolution);
    // This would typically trigger some action to resolve the conflict
    // For now, we'll just log it
  }, []);

  // Update business rules
  const updateBusinessRules = useCallback((rules: Partial<BusinessRules>) => {
    validationSystem.updateBusinessRules(rules);
    // Re-validate if we have existing results
    if (validationResult && autoValidate) {
      performValidation(() => validationResult, true);
    }
  }, [validationSystem, validationResult, autoValidate, performValidation]);

  // Get conflicts by entity name
  const getConflictsByEntity = useCallback((entityName: string): DateConflict[] => {
    if (!validationResult) return [];
    
    return validationResult.conflicts.filter(conflict => 
      conflict.entity1.name === entityName || 
      (conflict.entity2 && conflict.entity2.name === entityName)
    );
  }, [validationResult]);

  // Get conflicts by type
  const getConflictsByType = useCallback((type: DateConflict['type']): DateConflict[] => {
    if (!validationResult) return [];
    
    return validationResult.conflicts.filter(conflict => conflict.type === type);
  }, [validationResult]);

  // Get suggestions for a conflict
  const getSuggestions = useCallback((conflict: DateConflict): string[] => {
    return validationSystem.getSuggestions(conflict);
  }, [validationSystem]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  return {
    // Validation functions
    validateSemester,
    validateHoliday,
    validateAcademicCalendar,
    
    // State
    validationResult,
    isValidating,
    
    // Conflict data
    ...conflictData,
    
    // Actions
    clearValidation,
    resolveConflict,
    updateBusinessRules,
    
    // Utilities
    getConflictsByEntity,
    getConflictsByType,
    getSuggestions,
  };
};

// Hook for real-time validation of form fields
export const useFormDateValidation = (
  formData: Partial<Semester | Holiday>,
  formType: 'semester' | 'holiday',
  contextData?: {
    semesters?: Semester[];
    holidays?: Holiday[];
  }
) => {
  const validation = useDateValidation({ autoValidate: true, debounceMs: 500 });
  
  // Validate form data whenever it changes
  useEffect(() => {
    if (!formData || Object.keys(formData).length === 0) {
      validation.clearValidation();
      return;
    }

    try {
      if (formType === 'semester' && formData.startDate && formData.endDate) {
        const semester = formData as Semester;
        if (semester.name && semester.academicYear && 
            semester.registrationStartDate && semester.registrationEndDate &&
            semester.examStartDate && semester.examEndDate) {
          validation.validateSemester(semester, contextData?.semesters);
        }
      } else if (formType === 'holiday' && formData.startDate && formData.endDate) {
        const holiday = formData as Holiday;
        if (holiday.name && holiday.type) {
          validation.validateHoliday(
            holiday, 
            contextData?.semesters, 
            contextData?.holidays
          );
        }
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  }, [formData, formType, contextData, validation]);

  return validation;
};

export default useDateValidation;