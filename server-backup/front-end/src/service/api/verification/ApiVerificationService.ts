import type { AxiosResponse } from "axios";
import type { VisitorInterface } from "../visitor/type";

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Inconsistency report interface
export interface InconsistencyReport {
  endpoint: string;
  expectedFields: string[];
  missingFields: string[];
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

// API call log interface
export interface ApiCallLog {
  endpoint: string;
  method: string;
  requestData?: any;
  responseData?: any;
  statusCode?: number;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Service for API verification and data integrity checking
 */
export class ApiVerificationService {
  private logs: ApiCallLog[] = [];
  private inconsistencies: InconsistencyReport[] = [];

  /**
   * Verify data integrity of visitor data
   */
  verifyDataIntegrity(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!data) {
      errors.push({
        field: "root",
        message: "Data is null or undefined",
        code: "NULL_DATA",
      });
      return { isValid: false, errors, warnings };
    }

    // Validate visitor data structure
    if (Array.isArray(data)) {
      data.forEach((visitor, index) => {
        this.validateVisitorStructure(visitor, index, errors, warnings);
      });
    } else {
      this.validateVisitorStructure(data, 0, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Log API call details
   */
  logApiCall(
    endpoint: string,
    method: string = "GET",
    requestData?: any,
    response?: AxiosResponse,
    startTime?: number,
    error?: any
  ): void {
    const timestamp = new Date();
    const duration = startTime ? Date.now() - startTime : 0;

    const log: ApiCallLog = {
      endpoint,
      method,
      requestData,
      responseData: response?.data,
      statusCode: response?.status,
      timestamp,
      duration,
      success: !error && response?.status && response.status < 400,
      error: error?.message || error,
    };

    this.logs.push(log);

    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("API Call Log:", log);
    }
  }

  /**
   * Detect data inconsistencies
   */
  detectDataInconsistencies(): InconsistencyReport[] {
    return this.inconsistencies;
  }

  /**
   * Get recent API call logs
   */
  getRecentLogs(limit: number = 10): ApiCallLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Clear all logs and inconsistencies
   */
  clearLogs(): void {
    this.logs = [];
    this.inconsistencies = [];
  }

  /**
   * Validate visitor data structure
   */
  private validateVisitorStructure(
    visitor: any,
    index: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const prefix = `visitor[${index}]`;

    // Required fields validation
    if (!visitor.id) {
      errors.push({
        field: `${prefix}.id`,
        message: "Visitor ID is required",
        code: "MISSING_ID",
      });
    }

    if (!visitor.studentEnrollId) {
      errors.push({
        field: `${prefix}.studentEnrollId`,
        message: "Student enrollment ID is required",
        code: "MISSING_STUDENT_ENROLL_ID",
      });
    }

    // Validate nested studentEnroll structure
    if (visitor.studentEnroll) {
      this.validateStudentEnrollStructure(
        visitor.studentEnroll,
        `${prefix}.studentEnroll`,
        errors,
        warnings
      );
    } else {
      errors.push({
        field: `${prefix}.studentEnroll`,
        message: "Student enrollment data is missing",
        code: "MISSING_STUDENT_ENROLL",
      });
    }

    // Validate schedules array
    if (visitor.schedules && !Array.isArray(visitor.schedules)) {
      errors.push({
        field: `${prefix}.schedules`,
        message: "Schedules should be an array",
        code: "INVALID_SCHEDULES_TYPE",
      });
    }

    // Date validation
    if (visitor.createdAt && !this.isValidDate(visitor.createdAt)) {
      warnings.push({
        field: `${prefix}.createdAt`,
        message: "Invalid created date format",
        code: "INVALID_DATE_FORMAT",
      });
    }

    if (visitor.updatedAt && !this.isValidDate(visitor.updatedAt)) {
      warnings.push({
        field: `${prefix}.updatedAt`,
        message: "Invalid updated date format",
        code: "INVALID_DATE_FORMAT",
      });
    }
  }

  /**
   * Validate student enrollment structure
   */
  private validateStudentEnrollStructure(
    studentEnroll: any,
    prefix: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!studentEnroll.id) {
      errors.push({
        field: `${prefix}.id`,
        message: "Student enrollment ID is required",
        code: "MISSING_ID",
      });
    }

    if (!studentEnroll.student) {
      errors.push({
        field: `${prefix}.student`,
        message: "Student data is missing",
        code: "MISSING_STUDENT",
      });
    } else {
      this.validateStudentStructure(
        studentEnroll.student,
        `${prefix}.student`,
        errors,
        warnings
      );
    }

    if (!studentEnroll.student_training) {
      warnings.push({
        field: `${prefix}.student_training`,
        message: "Student training data is missing",
        code: "MISSING_STUDENT_TRAINING",
      });
    } else {
      this.validateStudentTrainingStructure(
        studentEnroll.student_training,
        `${prefix}.student_training`,
        errors,
        warnings
      );
    }
  }

  /**
   * Validate student structure
   */
  private validateStudentStructure(
    student: any,
    prefix: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const requiredFields = ["id", "name", "surname", "studentId"];

    requiredFields.forEach((field) => {
      if (!student[field]) {
        errors.push({
          field: `${prefix}.${field}`,
          message: `Student ${field} is required`,
          code: "MISSING_REQUIRED_FIELD",
        });
      }
    });

    // Email validation
    if (student.email && !this.isValidEmail(student.email)) {
      warnings.push({
        field: `${prefix}.email`,
        message: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT",
      });
    }

    // Phone number validation
    if (student.phoneNumber && !this.isValidPhoneNumber(student.phoneNumber)) {
      warnings.push({
        field: `${prefix}.phoneNumber`,
        message: "Invalid phone number format",
        code: "INVALID_PHONE_FORMAT",
      });
    }

    // GPAX validation
    if (student.gpax && (student.gpax < 0 || student.gpax > 4)) {
      warnings.push({
        field: `${prefix}.gpax`,
        message: "GPAX should be between 0 and 4",
        code: "INVALID_GPAX_RANGE",
      });
    }
  }

  /**
   * Validate student training structure
   */
  private validateStudentTrainingStructure(
    training: any,
    prefix: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!training.company) {
      errors.push({
        field: `${prefix}.company`,
        message: "Company data is required",
        code: "MISSING_COMPANY",
      });
    }

    // Date range validation
    if (training.startDate && training.endDate) {
      const startDate = new Date(training.startDate);
      const endDate = new Date(training.endDate);

      if (startDate >= endDate) {
        errors.push({
          field: `${prefix}.dateRange`,
          message: "Start date must be before end date",
          code: "INVALID_DATE_RANGE",
        });
      }
    }
  }

  /**
   * Utility methods for validation
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  }
}
