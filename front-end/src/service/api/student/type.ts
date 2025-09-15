import type { CourseSectionInterface, CourseInterface } from "../course/type";
export type StudentInterface = {
  id: number;
  userId: number;
  studentId: string;
  name: string;
  middleName: string | null;
  surname: string;
  gpax: number;
  phoneNumber: string;
  email: string;
  picture: File | string | null;
  curriculumId: string;
  programId: string;
  facultyId: string;
  majorId: string;
  campusId: string;
  faculty: {
    id: number;
    campusId: number;
    facultyNameEn: string;
    facultyNameTh: string;
  };
  program: {
    id: number;
    facultyId: number;
    programNameEn: string;
    programNameTh: string;
    createdAt: string;
    updatedAt: string;
  };
};
export type StudentDTO = {
  user_id: number;
  student_id: string;
  name: string;
  middle_name: string | null;
  surname: string;
  gpax: number;
  phone_number: string;
  email: string;
  picture: File | string | null;
  major_id: number;
  program_id: number;
  curriculum_id: number;
  faculty_id: number;
  campus_id: number;
};

export type StudentEnrollDTO = {
  student_id: number;
  course_section_id: number;
  document_language: "th" | "en";

  company_register_number: string;
  company_name_en: string;
  company_name_th: string;
  company_address: string;
  company_map: string;
  company_email: string;
  company_phone_number: string;
  company_type: string;

  picture_1: string | File;
  picture_2: string | File;

  start_date: Date | string;
  end_date: Date | string;
  coordinator: string;
  coordinator_phone_number: string;
  coordinator_email: string;
  supervisor: string;
  supervisor_phone_number: string;
  supervisor_email: string;
  department: string;
  position: string;
  job_description: string;
};

export interface StudentEnrollInterface {
  id: number;
  studentId: number;
  courseSectionId: number;
  grade: string | null;
  createdAt: string;
  updatedAt: string;
  student_training: {
    id: number;
    studentEnrollId: number;
    company: {
      id: number;
      companyRegisterNumber: string;
      companyNameEn: string | null;
      companyNameTh: string;
      companyAddress: string;
      companyMap: string;
      companyPhoneNumber: string;
      companyEmail: string;
      companyType: string;
      createdAt: string;
      updatedAt: string;
      company_picture: {
        id: number;
        companyId: number;
        picture: string | null;
        createdAt: string;
        updatedAt: string;
      }[];
    };
  };
  student: StudentInterface;
  course_section: CourseSectionInterface<CourseInterface>;
}

export interface StudentEnrollRegisterInteface extends StudentEnrollInterface {
  student_training: StudentTrainingType;
  visitor_training: [
    {
      id: number;
      visitorInstructorId: number;
      studentEnrollId: number;
      createdAt: string;
      updatedAt: string;
      visitor: {
        id: number;
        userId: number;
        staffId: string;
        name: string;
        middleName: string | null;
        surname: string;
        facultyId: number;
        programId: number;
        createdAt: string;
        updatedAt: string;
      };
    }
  ];
}

export type StudentTrainingType = {
  id: number;
  studentEnrollId: number;
  companyId: number;
  startDate: string;
  endDate: string;
  documentLanguage: "th" | "en";
  coordinator: string;
  coordinatorPhoneNumber: string;
  coordinatorEmail: string;
  supervisor: string;
  supervisorPhoneNumber: string;
  supervisorEmail: string;
  department: string;
  position: string;
  jobDescription: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: number;
    companyRegisterNumber: string;
    companyNameEn: string | null;
    companyNameTh: string;
    companyAddress: string;
    companyMap: string;
    companyPhoneNumber: string;
    companyEmail: string;
    companyType: string;
    createdAt: string;
    updatedAt: string;
    company_picture: {
      id: number;
      companyId: number;
      picture: string | null;
      createdAt: string;
      updatedAt: string;
    }[];
  };
};

export type StudentEvaluateCompanyInterface = {
  id: number;
  studentTrainingId: number;
  score: number | null;
  questions: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  student_training: {
    id: number;
    studentEnrollId: number;
    companyId: number;
    startDate: string;
    endDate: string;
    documentLanguage: "th" | "en";
    coordinator: string;
    coordinatorPhoneNumber: string;
    coordinatorEmail: string;
    supervisor: string;
    supervisorPhoneNumber: string;
    supervisorEmail: string;
    department: string;
    position: string;
    jobDescription: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type StudentEvaluateCompanyDTO = {
  ids: number[];
  scores: number[];
  comment: string;
};

// New interfaces for evaluation status feature
export interface EvaluationStatusResponse {
  hasEvaluated: boolean;
  evaluationDate?: string;
  companyName: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  redirectUrl: string;
  evaluationId: number;
}
