/**
 * Comprehensive Date Validation System for Academic Calendar
 * Implements business rule validation, conflict detection, and date range validation
 */

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Types for validation system
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Semester extends DateRange {
  id?: number;
  name: string;
  academicYear: string;
  registrationStartDate: string;
  registrationEndDate: string;
  examStartDate: string;
  examEndDate: string;
  isActive: boolean;
}

export interface Holiday extends DateRange {
  id?: number;
  name: string;
  type: 'national' | 'university' | 'semester_break';
  description?: string;
  isRecurring: boolean;
  semesterId?: number;
}

export interface DateConflict {
  type: 'overlap' | 'gap' | 'invalid_sequence' | 'past_date' | 'future_limit';
  entity1: CalendarEntity;
  entity2?: CalendarEntity;
  conflictDates: DateRange;
  severity: 'error' | 'warning';
  message: string;
  suggestions?: string[];
}

export interface CalendarEntity {
  id?: number;
  name: string;
  type: 'semester' | 'holiday' | 'registration' | 'exam';
  startDate: string;
  endDate: string;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: DateConflict[];
  warnings: DateConflict[];
  errors: DateConflict[];
}

export interface BusinessRules {
  minSemesterDuration: number; // days
  maxSemesterDuration: number; // days
  minRegistrationPeriod: number; // days
  maxRegistrationPeriod: number; // days
  minExamPeriod: number; // days
  maxExamPeriod: number; // days
  registrationBeforeSemester: number; // days before semester start
  examAfterSemester: number; // days before semester end
  minGapBetweenSemesters: number; // days
  maxFutureDate: number; // years from now
  allowPastModification: boolean;
}

// Default business rules for Thai academic calendar
export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  minSemesterDuration: 90, // ~3 months
  maxSemesterDuration: 180, // ~6 months
  minRegistrationPeriod: 7, // 1 week
  maxRegistrationPeriod: 30, // 1 month
  minExamPeriod: 7, // 1 week
  maxExamPeriod: 21, // 3 weeks
  registrationBeforeSemester: 30, // 1 month before
  examAfterSemester: 14, // 2 weeks before semester end
  minGapBetweenSemesters: 7, // 1 week gap
  maxFutureDate: 5, // 5 years from now
  allowPastModification: false,
};

export class DateValidationSystem {
  private businessRules: BusinessRules;

  constructor(businessRules: BusinessRules = DEFAULT_BUSINESS_RULES) {
    this.businessRules = businessRules;
  }

  /**
   * Validate a single date range
   */
  validateDateRange(range: DateRange, entityName: string = 'Entity'): DateConflict[] {
    const conflicts: DateConflict[] = [];
    const start = dayjs(range.startDate);
    const end = dayjs(range.endDate);
    const now = dayjs();

    // Check if start date is before end date
    if (start.isAfter(end)) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: entityName,
          type: 'semester',
          startDate: range.startDate,
          endDate: range.endDate,
        },
        conflictDates: range,
        severity: 'error',
        message: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด',
        suggestions: ['ตรวจสอบวันที่เริ่มต้นและวันที่สิ้นสุดให้ถูกต้อง'],
      });
    }

    // Check if dates are in the past (if not allowed)
    if (!this.businessRules.allowPastModification) {
      if (start.isBefore(now, 'day')) {
        conflicts.push({
          type: 'past_date',
          entity1: {
            name: entityName,
            type: 'semester',
            startDate: range.startDate,
            endDate: range.endDate,
          },
          conflictDates: range,
          severity: 'warning',
          message: 'วันที่เริ่มต้นอยู่ในอดีต',
          suggestions: ['เลือกวันที่ในอนาคต', 'ตรวจสอบการตั้งค่าระบบสำหรับการแก้ไขข้อมูลในอดีต'],
        });
      }
    }

    // Check if dates are too far in the future
    const maxFutureDate = now.add(this.businessRules.maxFutureDate, 'year');
    if (end.isAfter(maxFutureDate)) {
      conflicts.push({
        type: 'future_limit',
        entity1: {
          name: entityName,
          type: 'semester',
          startDate: range.startDate,
          endDate: range.endDate,
        },
        conflictDates: range,
        severity: 'warning',
        message: `วันที่สิ้นสุดเกิน ${this.businessRules.maxFutureDate} ปีจากปัจจุบัน`,
        suggestions: ['เลือกวันที่ที่ใกล้กับปัจจุบันมากขึ้น'],
      });
    }

    return conflicts;
  }

  /**
   * Validate semester business rules
   */
  validateSemester(semester: Semester, existingSemesters: Semester[] = []): ValidationResult {
    const conflicts: DateConflict[] = [];
    
    // Basic date range validation
    conflicts.push(...this.validateDateRange(semester, semester.name));

    const start = dayjs(semester.startDate);
    const end = dayjs(semester.endDate);
    const regStart = dayjs(semester.registrationStartDate);
    const regEnd = dayjs(semester.registrationEndDate);
    const examStart = dayjs(semester.examStartDate);
    const examEnd = dayjs(semester.examEndDate);

    // Validate semester duration
    const duration = end.diff(start, 'day');
    if (duration < this.businessRules.minSemesterDuration) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: semester.name,
          type: 'semester',
          startDate: semester.startDate,
          endDate: semester.endDate,
        },
        conflictDates: { startDate: semester.startDate, endDate: semester.endDate },
        severity: 'error',
        message: `ระยะเวลาภาคการศึกษาต้องไม่น้อยกว่า ${this.businessRules.minSemesterDuration} วัน`,
        suggestions: ['ขยายระยะเวลาภาคการศึกษา', 'ตรวจสอบวันที่เริ่มต้นและสิ้นสุด'],
      });
    }

    if (duration > this.businessRules.maxSemesterDuration) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: semester.name,
          type: 'semester',
          startDate: semester.startDate,
          endDate: semester.endDate,
        },
        conflictDates: { startDate: semester.startDate, endDate: semester.endDate },
        severity: 'warning',
        message: `ระยะเวลาภาคการศึกษาเกิน ${this.businessRules.maxSemesterDuration} วัน`,
        suggestions: ['ลดระยะเวลาภาคการศึกษา', 'แบ่งเป็นหลายภาคการศึกษา'],
      });
    }

    // Validate registration period
    const regDuration = regEnd.diff(regStart, 'day');
    if (regDuration < this.businessRules.minRegistrationPeriod) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: `ลงทะเบียน ${semester.name}`,
          type: 'registration',
          startDate: semester.registrationStartDate,
          endDate: semester.registrationEndDate,
        },
        conflictDates: { 
          startDate: semester.registrationStartDate, 
          endDate: semester.registrationEndDate 
        },
        severity: 'error',
        message: `ระยะเวลาลงทะเบียนต้องไม่น้อยกว่า ${this.businessRules.minRegistrationPeriod} วัน`,
        suggestions: ['ขยายระยะเวลาลงทะเบียน'],
      });
    }

    // Validate registration timing (should be before semester)
    if (regEnd.isAfter(start)) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: `ลงทะเบียน ${semester.name}`,
          type: 'registration',
          startDate: semester.registrationStartDate,
          endDate: semester.registrationEndDate,
        },
        conflictDates: { 
          startDate: semester.registrationStartDate, 
          endDate: semester.registrationEndDate 
        },
        severity: 'error',
        message: 'ระยะเวลาลงทะเบียนต้องสิ้นสุดก่อนเริ่มภาคการศึกษา',
        suggestions: ['เลื่อนวันสิ้นสุดการลงทะเบียนให้เร็วขึ้น', 'เลื่อนวันเริ่มภาคการศึกษาให้ช้าลง'],
      });
    }

    // Validate exam period
    const examDuration = examEnd.diff(examStart, 'day');
    if (examDuration < this.businessRules.minExamPeriod) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: `สอบ ${semester.name}`,
          type: 'exam',
          startDate: semester.examStartDate,
          endDate: semester.examEndDate,
        },
        conflictDates: { 
          startDate: semester.examStartDate, 
          endDate: semester.examEndDate 
        },
        severity: 'error',
        message: `ระยะเวลาสอบต้องไม่น้อยกว่า ${this.businessRules.minExamPeriod} วัน`,
        suggestions: ['ขยายระยะเวลาสอบ'],
      });
    }

    // Validate exam timing (should be within semester period)
    if (examStart.isBefore(start) || examEnd.isAfter(end)) {
      conflicts.push({
        type: 'invalid_sequence',
        entity1: {
          name: `สอบ ${semester.name}`,
          type: 'exam',
          startDate: semester.examStartDate,
          endDate: semester.examEndDate,
        },
        conflictDates: { 
          startDate: semester.examStartDate, 
          endDate: semester.examEndDate 
        },
        severity: 'error',
        message: 'ระยะเวลาสอบต้องอยู่ภายในภาคการศึกษา',
        suggestions: ['ปรับระยะเวลาสอบให้อยู่ในช่วงภาคการศึกษา'],
      });
    }

    // Check overlaps with existing semesters
    const otherSemesters = existingSemesters.filter(s => s.id !== semester.id);
    for (const otherSemester of otherSemesters) {
      const overlap = this.checkDateRangeOverlap(
        { startDate: semester.startDate, endDate: semester.endDate },
        { startDate: otherSemester.startDate, endDate: otherSemester.endDate }
      );

      if (overlap) {
        conflicts.push({
          type: 'overlap',
          entity1: {
            name: semester.name,
            type: 'semester',
            startDate: semester.startDate,
            endDate: semester.endDate,
          },
          entity2: {
            name: otherSemester.name,
            type: 'semester',
            startDate: otherSemester.startDate,
            endDate: otherSemester.endDate,
          },
          conflictDates: overlap,
          severity: 'error',
          message: `ภาคการศึกษา "${semester.name}" ซ้อนทับกับ "${otherSemester.name}"`,
          suggestions: [
            'ปรับวันที่เริ่มต้นหรือสิ้นสุดของภาคการศึกษา',
            'ตรวจสอบปฏิทินการศึกษาทั้งหมด',
          ],
        });
      }
    }

    return this.categorizeConflicts(conflicts);
  }

  /**
   * Validate holiday against semesters and other holidays
   */
  validateHoliday(
    holiday: Holiday, 
    semesters: Semester[] = [], 
    existingHolidays: Holiday[] = []
  ): ValidationResult {
    const conflicts: DateConflict[] = [];
    
    // Basic date range validation
    conflicts.push(...this.validateDateRange(holiday, holiday.name));

    // Check if holiday overlaps with semesters (warning for university holidays)
    if (holiday.type === 'university') {
      for (const semester of semesters) {
        const overlap = this.checkDateRangeOverlap(holiday, semester);
        if (overlap) {
          conflicts.push({
            type: 'overlap',
            entity1: {
              name: holiday.name,
              type: 'holiday',
              startDate: holiday.startDate,
              endDate: holiday.endDate,
            },
            entity2: {
              name: semester.name,
              type: 'semester',
              startDate: semester.startDate,
              endDate: semester.endDate,
            },
            conflictDates: overlap,
            severity: 'warning',
            message: `วันหยุด "${holiday.name}" อยู่ในช่วงภาคการศึกษา "${semester.name}"`,
            suggestions: [
              'ตรวจสอบว่าวันหยุดนี้เหมาะสมหรือไม่',
              'พิจารณาเปลี่ยนประเภทเป็น "semester_break"',
            ],
          });
        }
      }
    }

    // Check overlaps with existing holidays
    const otherHolidays = existingHolidays.filter(h => h.id !== holiday.id);
    for (const otherHoliday of otherHolidays) {
      const overlap = this.checkDateRangeOverlap(holiday, otherHoliday);
      if (overlap) {
        const severity = holiday.type === otherHoliday.type ? 'error' : 'warning';
        conflicts.push({
          type: 'overlap',
          entity1: {
            name: holiday.name,
            type: 'holiday',
            startDate: holiday.startDate,
            endDate: holiday.endDate,
          },
          entity2: {
            name: otherHoliday.name,
            type: 'holiday',
            startDate: otherHoliday.startDate,
            endDate: otherHoliday.endDate,
          },
          conflictDates: overlap,
          severity,
          message: `วันหยุด "${holiday.name}" ซ้อนทับกับ "${otherHoliday.name}"`,
          suggestions: [
            'ปรับวันที่ของวันหยุดให้ไม่ซ้อนทับ',
            'รวมวันหยุดเป็นช่วงเดียวกัน',
          ],
        });
      }
    }

    return this.categorizeConflicts(conflicts);
  }

  /**
   * Check if two date ranges overlap
   */
  private checkDateRangeOverlap(range1: DateRange, range2: DateRange): DateRange | null {
    const start1 = dayjs(range1.startDate);
    const end1 = dayjs(range1.endDate);
    const start2 = dayjs(range2.startDate);
    const end2 = dayjs(range2.endDate);

    // Check if ranges overlap
    const overlapStart = start1.isAfter(start2) ? start1 : start2;
    const overlapEnd = end1.isBefore(end2) ? end1 : end2;

    if (overlapStart.isSameOrBefore(overlapEnd)) {
      return {
        startDate: overlapStart.format('YYYY-MM-DD'),
        endDate: overlapEnd.format('YYYY-MM-DD'),
      };
    }

    return null;
  }

  /**
   * Categorize conflicts into errors and warnings
   */
  private categorizeConflicts(conflicts: DateConflict[]): ValidationResult {
    const errors = conflicts.filter(c => c.severity === 'error');
    const warnings = conflicts.filter(c => c.severity === 'warning');

    return {
      isValid: errors.length === 0,
      conflicts,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire academic calendar
   */
  validateAcademicCalendar(
    semesters: Semester[], 
    holidays: Holiday[]
  ): ValidationResult {
    const allConflicts: DateConflict[] = [];

    // Validate each semester
    for (const semester of semesters) {
      const result = this.validateSemester(semester, semesters);
      allConflicts.push(...result.conflicts);
    }

    // Validate each holiday
    for (const holiday of holidays) {
      const result = this.validateHoliday(holiday, semesters, holidays);
      allConflicts.push(...result.conflicts);
    }

    // Check for gaps between semesters in the same academic year
    const semestersByYear = this.groupSemestersByYear(semesters);
    for (const [year, yearSemesters] of Object.entries(semestersByYear)) {
      const sortedSemesters = yearSemesters.sort((a, b) => 
        dayjs(a.startDate).diff(dayjs(b.startDate))
      );

      for (let i = 0; i < sortedSemesters.length - 1; i++) {
        const current = sortedSemesters[i];
        const next = sortedSemesters[i + 1];
        
        const gap = dayjs(next.startDate).diff(dayjs(current.endDate), 'day');
        if (gap < this.businessRules.minGapBetweenSemesters) {
          allConflicts.push({
            type: 'gap',
            entity1: {
              name: current.name,
              type: 'semester',
              startDate: current.startDate,
              endDate: current.endDate,
            },
            entity2: {
              name: next.name,
              type: 'semester',
              startDate: next.startDate,
              endDate: next.endDate,
            },
            conflictDates: {
              startDate: current.endDate,
              endDate: next.startDate,
            },
            severity: 'warning',
            message: `ช่วงห่างระหว่างภาคการศึกษาน้อยเกินไป (${gap} วัน)`,
            suggestions: [
              'เพิ่มช่วงห่างระหว่างภาคการศึกษา',
              'ปรับวันที่เริ่มต้นหรือสิ้นสุดของภาคการศึกษา',
            ],
          });
        }
      }
    }

    return this.categorizeConflicts(allConflicts);
  }

  /**
   * Group semesters by academic year
   */
  private groupSemestersByYear(semesters: Semester[]): Record<string, Semester[]> {
    return semesters.reduce((acc, semester) => {
      if (!acc[semester.academicYear]) {
        acc[semester.academicYear] = [];
      }
      acc[semester.academicYear].push(semester);
      return acc;
    }, {} as Record<string, Semester[]>);
  }

  /**
   * Get suggestions for resolving conflicts
   */
  getSuggestions(conflict: DateConflict): string[] {
    return conflict.suggestions || [];
  }

  /**
   * Update business rules
   */
  updateBusinessRules(newRules: Partial<BusinessRules>): void {
    this.businessRules = { ...this.businessRules, ...newRules };
  }
}

// Export singleton instance
export const dateValidationSystem = new DateValidationSystem();

// Export utility functions
export const validateDateRange = (range: DateRange, entityName?: string) => 
  dateValidationSystem.validateDateRange(range, entityName);

export const validateSemester = (semester: Semester, existingSemesters?: Semester[]) =>
  dateValidationSystem.validateSemester(semester, existingSemesters);

export const validateHoliday = (holiday: Holiday, semesters?: Semester[], existingHolidays?: Holiday[]) =>
  dateValidationSystem.validateHoliday(holiday, semesters, existingHolidays);

export const validateAcademicCalendar = (semesters: Semester[], holidays: Holiday[]) =>
  dateValidationSystem.validateAcademicCalendar(semesters, holidays);