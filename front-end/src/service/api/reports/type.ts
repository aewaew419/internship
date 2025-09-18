export interface ReportsFilters {
  year?: number;
  semester?: number;
  course_id?: number;
  view?: 'summary' | 'detail';
}

export interface AttendanceData {
  attended: number;
  not_attended: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
}

export interface CourseSectionBreakdown {
  course_id: number;
  section: string;
  year: number;
  semester: number;
  count: number;
}

export interface CourseBreakdown {
  course_id: number;
  count: number;
}

export interface ReportsSummaryResponse {
  filters: {
    year: number | null;
    semester: number | null;
    course_id: number | null;
  };
  totals: {
    enrollments: number;
    attendance: AttendanceData;
  };
  distributions: {
    grades: GradeDistribution[];
  };
  breakdowns: {
    by_course_section: CourseSectionBreakdown[];
    by_course: CourseBreakdown[];
  };
}

export interface StudentEnrollDetail {
  id: number;
  student: {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
  };
  course_section: {
    id: number;
    course_id: number;
    section: string;
    year: number;
    semester: number;
  };
  student_training?: any;
  grade?: string;
  attend_training?: boolean;
}

export type ReportsResponse = ReportsSummaryResponse | StudentEnrollDetail[];