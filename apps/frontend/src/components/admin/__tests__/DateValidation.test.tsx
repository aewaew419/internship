import { render, screen } from '@testing-library/react';
import { DateConflictIndicator } from '../DateConflictIndicator';
import { 
  DateConflict, 
  validateSemester, 
  validateHoliday,
  validateAcademicCalendar,
  Semester,
  Holiday 
} from '@/lib/validation/dateValidation';

// Mock data for testing
const mockSemester: Semester = {
  id: 1,
  name: 'ภาคการศึกษาที่ 1/2567',
  academicYear: '2567',
  startDate: '2024-08-15',
  endDate: '2024-12-15',
  registrationStartDate: '2024-07-01',
  registrationEndDate: '2024-08-10',
  examStartDate: '2024-12-01',
  examEndDate: '2024-12-10',
  isActive: true,
};

const overlappingSemester: Semester = {
  id: 2,
  name: 'ภาคการศึกษาที่ 2/2567',
  academicYear: '2567',
  startDate: '2024-12-01', // Overlaps with first semester
  endDate: '2025-04-15',
  registrationStartDate: '2024-10-01',
  registrationEndDate: '2024-11-25',
  examStartDate: '2025-04-01',
  examEndDate: '2025-04-10',
  isActive: true,
};

const mockHoliday: Holiday = {
  id: 1,
  name: 'วันหยุดกลางภาค',
  startDate: '2024-10-15',
  endDate: '2024-10-17',
  type: 'university',
  isRecurring: false,
};

describe('Date Validation System', () => {
  describe('validateSemester', () => {
    it('should validate a valid semester without conflicts', () => {
      const result = validateSemester(mockSemester);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect overlapping semesters', () => {
      const result = validateSemester(overlappingSemester, [mockSemester]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const overlapError = result.errors.find(error => error.type === 'overlap');
      expect(overlapError).toBeDefined();
      expect(overlapError?.message).toContain('ซ้อนทับ');
    });

    it('should validate registration period timing', () => {
      const invalidSemester: Semester = {
        ...mockSemester,
        registrationEndDate: '2024-08-20', // After semester start
      };
      
      const result = validateSemester(invalidSemester);
      expect(result.isValid).toBe(false);
      
      const timingError = result.errors.find(error => 
        error.message.includes('ลงทะเบียนต้องสิ้นสุดก่อนเริ่มภาคการศึกษา')
      );
      expect(timingError).toBeDefined();
    });

    it('should validate exam period within semester', () => {
      const invalidSemester: Semester = {
        ...mockSemester,
        examEndDate: '2024-12-20', // After semester end
      };
      
      const result = validateSemester(invalidSemester);
      expect(result.isValid).toBe(false);
      
      const examError = result.errors.find(error => 
        error.message.includes('สอบต้องอยู่ภายในภาคการศึกษา')
      );
      expect(examError).toBeDefined();
    });
  });

  describe('validateHoliday', () => {
    it('should validate a valid holiday', () => {
      const result = validateHoliday(mockHoliday);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about university holidays during semester', () => {
      const result = validateHoliday(mockHoliday, [mockSemester]);
      // This should be a warning, not an error
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const semesterWarning = result.warnings.find(warning => 
        warning.message.includes('อยู่ในช่วงภาคการศึกษา')
      );
      expect(semesterWarning).toBeDefined();
    });
  });

  describe('validateAcademicCalendar', () => {
    it('should validate entire academic calendar', () => {
      const result = validateAcademicCalendar([mockSemester], [mockHoliday]);
      
      // Should have warnings about holiday during semester
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect multiple conflicts in calendar', () => {
      const result = validateAcademicCalendar(
        [mockSemester, overlappingSemester], 
        [mockHoliday]
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('DateConflictIndicator Component', () => {
  const mockConflicts: DateConflict[] = [
    {
      type: 'overlap',
      entity1: {
        name: 'ภาคการศึกษาที่ 1/2567',
        type: 'semester',
        startDate: '2024-08-15',
        endDate: '2024-12-15',
      },
      entity2: {
        name: 'ภาคการศึกษาที่ 2/2567',
        type: 'semester',
        startDate: '2024-12-01',
        endDate: '2025-04-15',
      },
      conflictDates: {
        startDate: '2024-12-01',
        endDate: '2024-12-15',
      },
      severity: 'error',
      message: 'ภาคการศึกษาซ้อนทับกัน',
      suggestions: ['ปรับวันที่เริ่มต้นหรือสิ้นสุด'],
    },
  ];

  it('should render conflict indicator with conflicts', () => {
    render(<DateConflictIndicator conflicts={mockConflicts} />);
    
    expect(screen.getByText('สรุปข้อขัดแย้ง')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total conflicts
    expect(screen.getByText('ข้อผิดพลาดที่ต้องแก้ไข (1)')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษาซ้อนทับกัน')).toBeInTheDocument();
  });

  it('should show success message when no conflicts', () => {
    render(<DateConflictIndicator conflicts={[]} />);
    
    expect(screen.getByText('ไม่พบข้อขัดแย้งในปฏิทินการศึกษา')).toBeInTheDocument();
  });

  it('should display suggestions when enabled', () => {
    render(<DateConflictIndicator conflicts={mockConflicts} showSuggestions={true} />);
    
    expect(screen.getByText('คำแนะนำการแก้ไข')).toBeInTheDocument();
    expect(screen.getByText('ปรับวันที่เริ่มต้นหรือสิ้นสุด')).toBeInTheDocument();
  });
});