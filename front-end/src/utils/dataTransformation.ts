import type { VisitorInterface } from '../service/api/visitor/type';

// Enums for status mapping
export enum AppointmentStatus {
  NOT_SCHEDULED = 'ยังไม่นัดหมาย',
  SCHEDULED = 'นัดหมาย',
  COMPLETED = 'เสร็จสิ้น',
  CANCELLED = 'ยกเลิก'
}

// Display data interfaces
export interface ScheduleDisplayData {
  id: number;
  studentName: string;
  studentCode: string;
  companyName: string;
  contactName: string;
  supervisorName: string;
  appointmentStatus: AppointmentStatus;
  appointmentCount: number;
  lastVisitDate?: string;
  nextVisitDate?: string;
}

export interface ReportDisplayData {
  id: number;
  studentName: string;
  studentCode: string;
  companyName: string;
  supervisorName: string;
  jobPosition: string;
  appointmentStatus: AppointmentStatus;
  appointmentCount: number;
  evaluationScores?: number[];
  visitReports?: VisitReport[];
}

export interface VisitReport {
  visitNo: number;
  visitDate: string;
  comment: string;
}

export interface EvaluationScore {
  question: string;
  score: number;
}

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'ไม่ระบุวันที่';
    }
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'ไม่ระบุวันที่';
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'ไม่ระบุวันที่';
    }
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'ไม่ระบุวันที่';
  }
};

// Status mapping utilities
export const mapAppointmentStatus = (schedules: any[]): AppointmentStatus => {
  if (!schedules || schedules.length === 0) {
    return AppointmentStatus.NOT_SCHEDULED;
  }
  
  const now = new Date();
  const futureSchedules = schedules.filter(schedule => 
    new Date(schedule.visitAt) > now
  );
  
  if (futureSchedules.length > 0) {
    return AppointmentStatus.SCHEDULED;
  }
  
  return AppointmentStatus.COMPLETED;
};

export const getAppointmentStatusText = (schedules: any[]): string => {
  if (!schedules || schedules.length === 0) {
    return AppointmentStatus.NOT_SCHEDULED;
  }
  
  const status = mapAppointmentStatus(schedules);
  if (status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.COMPLETED) {
    return `${status} ${schedules.length} ครั้ง`;
  }
  
  return status;
};

// Data transformation functions
export const transformVisitorToScheduleData = (visitor: VisitorInterface): ScheduleDisplayData => {
  const student = visitor.studentEnroll.student;
  const nameParts = [student.name, student.middleName, student.surname].filter(Boolean);
  const fullName = nameParts.join(' ');
  
  // Get company and supervisor information from student training
  const training = visitor.studentEnroll.student_training;
  const companyName = training?.company?.companyNameTh || training?.company?.companyNameEn || 'ไม่ระบุบริษัท';
  const contactName = training?.coordinator || 'ไม่ระบุผู้ติดต่อ';
  
  // Get supervisor name from visitor instructor
  const supervisorParts = visitor.visitor ? 
    [visitor.visitor.name, visitor.visitor.middleName, visitor.visitor.surname].filter(Boolean) : [];
  const supervisorName = supervisorParts.length > 0 ? supervisorParts.join(' ') : 'อาจารย์นิเทศ';
  
  // Sort schedules by visit date
  const sortedSchedules = visitor.schedules.sort((a: any, b: any) => 
    new Date(a.visitAt).getTime() - new Date(b.visitAt).getTime()
  );
  
  const now = new Date();
  const pastSchedules = sortedSchedules.filter(schedule => 
    new Date(schedule.visitAt) <= now
  );
  const futureSchedules = sortedSchedules.filter(schedule => 
    new Date(schedule.visitAt) > now
  );
  
  return {
    id: visitor.id,
    studentName: fullName,
    studentCode: student.studentId,
    companyName,
    contactName,
    supervisorName,
    appointmentStatus: mapAppointmentStatus(visitor.schedules),
    appointmentCount: visitor.schedules.length,
    lastVisitDate: pastSchedules.length > 0 ? 
      formatDate(pastSchedules[pastSchedules.length - 1].visitAt) : undefined,
    nextVisitDate: futureSchedules.length > 0 ? 
      formatDate(futureSchedules[0].visitAt) : undefined
  };
};

export const transformVisitorToReportData = (visitor: VisitorInterface): ReportDisplayData => {
  const student = visitor.studentEnroll.student;
  const nameParts = [student.name, student.middleName, student.surname].filter(Boolean);
  const fullName = nameParts.join(' ');
  
  // Get company and job information from student training
  const training = visitor.studentEnroll.student_training;
  const companyName = training?.company?.companyNameTh || training?.company?.companyNameEn || 'ไม่ระบุบริษัท';
  const jobPosition = training?.position || 'ไม่ระบุตำแหน่ง';
  
  // Get supervisor name from visitor instructor
  const supervisorParts = visitor.visitor ? 
    [visitor.visitor.name, visitor.visitor.middleName, visitor.visitor.surname].filter(Boolean) : [];
  const supervisorName = supervisorParts.length > 0 ? supervisorParts.join(' ') : 'อาจารย์นิเทศ';
  
  const visitReports: VisitReport[] = visitor.schedules.map(schedule => ({
    visitNo: schedule.visitNo,
    visitDate: formatDate(schedule.visitAt),
    comment: schedule.comment || 'ไม่มีความเห็น'
  }));
  
  return {
    id: visitor.id,
    studentName: fullName,
    studentCode: student.studentId,
    companyName,
    supervisorName,
    jobPosition,
    appointmentStatus: mapAppointmentStatus(visitor.schedules),
    appointmentCount: visitor.schedules.length,
    visitReports
  };
};

// Validation utilities
export const validateVisitorData = (visitor: any): boolean => {
  return !!(
    visitor &&
    visitor.id &&
    visitor.studentEnroll &&
    visitor.studentEnroll.student &&
    visitor.studentEnroll.student.name &&
    visitor.studentEnroll.student.studentId &&
    (Array.isArray(visitor.schedules) || visitor.schedules === undefined)
  );
};

export const sanitizeVisitorData = (visitor: any): VisitorInterface | null => {
  if (!validateVisitorData(visitor)) {
    return null;
  }
  
  return {
    ...visitor,
    schedules: visitor.schedules || []
  } as VisitorInterface;
};