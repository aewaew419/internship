export type VisitorInterface = {
  id: number;
  visitorInstructorId: number;
  studentEnrollId: number;
  createdAt: string;
  updatedAt: string;
  studentEnroll: {
    id: number;
    studentId: number;
    courseSectionId: number;
    grade: string | null;
    createdAt: string;
    updatedAt: string;
    student: {
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
    };
    student_training?: {
      id: number;
      studentEnrollId: number;
      startDate: string;
      endDate: string;
      coordinator: string;
      coordinatorPhoneNumber: string;
      coordinatorEmail: string;
      supervisor: string;
      supervisorPhoneNumber: string;
      supervisorEmail: string;
      department: string;
      position: string;
      jobDescription: string;
      documentLanguage: 'th' | 'en';
      companyId: number;
      company?: {
        id: number;
        companyRegisterNumber: string;
        companyNameEn: string;
        companyNameTh: string;
        companyAddress: string;
        companyMap: string;
        companyEmail: string;
        companyPhoneNumber: string;
        companyType: string;
      };
    };
  };
  visitor?: {
    id: number;
    userId: number;
    instructorId: string;
    name: string;
    middleName: string | null;
    surname: string;
    phoneNumber: string | null;
    email: string | null;
  };
  schedules:
    | {
        id: number;
        visitorTrainingId: number;
        visitNo: number;
        visitAt: string;
        comment: string;
        createdAt: string;
        updatedAt: string;
      }[]
    | [];
};

export type VisitorScheduleDTO = {
  visitor_training_id: number;
  visit_no: number;
  visit_at: string;
  comment: string;
};

export type VisitorScheduleReportInterface = {
  id: number;
  visitorTrainingId: number;
  visitNo: number;
  visitAt: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VisitorEvaluateStudentDTO = {
  ids: number[];
  scores: number[];
  comment: string;
};

export type VisitorEvaluateStudentInterface = {
  id: number;
  visitorTrainingId: number;
  score: number;
  questions: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  training: {
    id: number;
    visitorInstructorId: number;
    studentEnrollId: number;
    createdAt: string;
    updatedAt: string;
  };
};
