// Base API types
export interface APIResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface APIError {
  message: string;
  status: number;
  code?: string;
}

// User types
export interface UserInterface {
  token: {
    type: string;
    name: string;
    token: string;
    abilities: ["*"];
    lastUsedAt: string;
    expiresAt: string;
  };
  expiresAt: string;
  user: {
    id: number;
    roleId: number;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    students: {
      id: number;
      userId: number;
      studentId: string;
      name: string;
      middleName: string | null;
      surname: string;
      gpax: number | null;
      phoneNumber: string | null;
      picture: null;
      email: string | null;
      campusId: number;
      facultyId: number | null;
      programId: number | null;
      curriculumId: number | null;
      majorId: number | null;
    } | null;
    instructors: {
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
    } | null;
  };
  roles: {
    student: boolean;
    instructor: boolean;
    committee: boolean;
    visitor: boolean;
    courseInstructor: boolean;
    list: string[];
  };
  token_type: "Bearer";
  access_token: string;
  abilities: ["*"];
  device_name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface StudentLoginDTO {
  studentId: string;
  password: string;
}

export interface UserListInterface {
  id: number;
  roleId: number;
  fullName: null;
  email: string;
  createdAt: string;
  updatedAt: string;
  instructors: {
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
  } | null;
  students: {
    id: number;
    userId: number;
    studentId: string;
    name: string;
    middleName: string | null;
    surname: string;
    gpax: number | null;
    phoneNumber: string | null;
    picture: null;
    email: string | null;
    campusId: number | null;
    facultyId: number | null;
    programId: number | null;
    curriculumId: number | null;
    majorId: number | null;
  } | null;
  role: {
    id: number;
    name: string;
  };
}

export interface InstructorInterface {
  id: number;
  userId: number;
  staffId: string;
  name: string;
  middleName: string | null;
  surname: string;
  facultyId: number | null;
  programId: number | null;
  createdAt: string;
  updatedAt: string;
}

// Student types
export interface StudentInterface {
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
}

export interface StudentDTO {
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
}

export interface StudentEnrollDTO {
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
}

export interface StudentEvaluateCompanyDTO {
  ids: number[];
  scores: number[];
  comment: string;
}

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