import { renderHook, act } from '@testing-library/react';
import { useAuthValidation } from '../useAuthValidation';
import type { StudentLoginDTO, AdminLoginDTO, RegistrationDTO } from '@/types/auth';

describe('useAuthValidation', () => {
  describe('validateStudentLogin', () => {
    it('should validate valid student login data', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const validData: StudentLoginDTO = {
        studentId: '12345678',
        password: 'password123',
      };

      const validation = result.current.validateStudentLogin(validData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for invalid student login data', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const invalidData: StudentLoginDTO = {
        studentId: '123', // Too short
        password: '123', // Too short
      };

      const validation = result.current.validateStudentLogin(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);
      expect(validation.errors[0].field).toBe('student_id');
      expect(validation.errors[1].field).toBe('password');
    });
  });

  describe('validateAdminLogin', () => {
    it('should validate valid admin login data', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const validData: AdminLoginDTO = {
        email: 'admin@example.com',
        password: 'password123',
      };

      const validation = result.current.validateAdminLogin(validData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for invalid admin login data', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const invalidData: AdminLoginDTO = {
        email: 'invalid-email',
        password: '123',
      };

      const validation = result.current.validateAdminLogin(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe('validateRegistration', () => {
    it('should validate valid registration data', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const validData: RegistrationDTO = {
        student_id: '12345678',
        email: 'student@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const validation = result.current.validateRegistration(validData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for password mismatch', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const invalidData: RegistrationDTO = {
        student_id: '12345678',
        email: 'student@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const validation = result.current.validateRegistration(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'confirmPassword')).toBe(true);
    });
  });

  describe('field validation', () => {
    it('should validate individual fields', async () => {
      const { result } = renderHook(() => useAuthValidation());
      
      await act(async () => {
        const error = await result.current.validateField('email', 'invalid-email', 'adminLogin');
        expect(error).toBe('รูปแบบอีเมลไม่ถูกต้อง');
      });
    });

    it('should clear field errors', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      act(() => {
        result.current.clearFieldError('email');
      });

      expect(result.current.getFieldError('email')).toBeNull();
    });
  });

  describe('password strength', () => {
    it('should calculate password strength correctly', () => {
      const { result } = renderHook(() => useAuthValidation());
      
      const weakPassword = result.current.getPasswordStrength('123');
      expect(weakPassword.score).toBeLessThan(3);
      
      const strongPassword = result.current.getPasswordStrength('Password123!');
      expect(strongPassword.score).toBeGreaterThan(4);
    });
  });
});