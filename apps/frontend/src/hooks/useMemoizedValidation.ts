import { useMemo, useCallback } from 'react';
import { validateStudentId, validatePassword } from '@/lib/utils';

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface ValidationCache {
  [key: string]: ValidationResult;
}

// Create a global cache for validation results
const validationCache: ValidationCache = {};

// Cache size limit to prevent memory leaks
const CACHE_SIZE_LIMIT = 1000;
const cacheKeys: string[] = [];

const addToCache = (key: string, result: ValidationResult) => {
  // Remove oldest entries if cache is full
  if (cacheKeys.length >= CACHE_SIZE_LIMIT) {
    const oldestKey = cacheKeys.shift();
    if (oldestKey) {
      delete validationCache[oldestKey];
    }
  }
  
  validationCache[key] = result;
  cacheKeys.push(key);
};

const getFromCache = (key: string): ValidationResult | undefined => {
  return validationCache[key];
};

export const useMemoizedValidation = () => {
  // Memoized student ID validation
  const validateStudentIdMemoized = useCallback((studentId: string): ValidationResult => {
    if (!studentId) {
      return { isValid: false, message: 'กรุณากรอกรหัสนักศึกษา' };
    }

    const cacheKey = `studentId:${studentId}`;
    const cached = getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = validateStudentId(studentId);
    addToCache(cacheKey, result);
    
    return result;
  }, []);

  // Memoized password validation
  const validatePasswordMemoized = useCallback((password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, message: 'กรุณากรอกรหัสผ่าน' };
    }

    const cacheKey = `password:${password.length}:${password.charAt(0)}`;
    const cached = getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = validatePassword(password);
    addToCache(cacheKey, result);
    
    return result;
  }, []);

  // Memoized form validation
  const validateFormMemoized = useMemo(() => {
    return (formData: { studentId: string; password: string }) => {
      const studentIdValidation = validateStudentIdMemoized(formData.studentId);
      const passwordValidation = validatePasswordMemoized(formData.password);

      return {
        isValid: studentIdValidation.isValid && passwordValidation.isValid,
        errors: {
          ...(studentIdValidation.isValid ? {} : { studentId: studentIdValidation.message }),
          ...(passwordValidation.isValid ? {} : { password: passwordValidation.message }),
        },
      };
    };
  }, [validateStudentIdMemoized, validatePasswordMemoized]);

  // Clear validation cache
  const clearValidationCache = useCallback(() => {
    Object.keys(validationCache).forEach(key => {
      delete validationCache[key];
    });
    cacheKeys.length = 0;
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      size: cacheKeys.length,
      limit: CACHE_SIZE_LIMIT,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }, []);

  return {
    validateStudentId: validateStudentIdMemoized,
    validatePassword: validatePasswordMemoized,
    validateForm: validateFormMemoized,
    clearValidationCache,
    getCacheStats,
  };
};

// Hook for memoizing expensive computations
export const useMemoizedComputation = <T, Args extends any[]>(
  computeFn: (...args: Args) => T,
  deps: Args,
  cacheKey?: string
) => {
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(deps);
    
    // Simple computation cache
    const computationCache = (globalThis as any).__computationCache || {};
    (globalThis as any).__computationCache = computationCache;
    
    if (computationCache[key]) {
      return computationCache[key];
    }
    
    const result = computeFn(...deps);
    computationCache[key] = result;
    
    return result;
  }, deps);
};

// Hook for debounced validation
export const useDebouncedValidation = (
  validationFn: (value: string) => ValidationResult,
  delay: number = 300
) => {
  const timeoutRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

  const debouncedValidate = useCallback((
    value: string,
    callback: (result: ValidationResult) => void
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const result = validationFn(value);
      callback(result);
    }, delay);
  }, [validationFn, delay]);

  const cancelValidation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    debouncedValidate,
    cancelValidation,
  };
};