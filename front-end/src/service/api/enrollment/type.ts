export type EnrollStatusDTO = {
  ids: number[];
  status: "approve" | "denied" | "pending";
  remarks: string;
};
export type AssignVisitorDTO = {
  student_enroll_ids: number[] | number;
  visitor_instructor_id: number;
};
export type EnrollApproveInterface = {
  id: number;
  studentId: number;
  courseSectionId: number;
  grade: string | null;
  attendTraining: string | null;
  companyScore: string | null;
  createdAt: string;
  updatedAt: string;
  visitor_training: {
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
      middleName: string;
      surname: string;
      facultyId: number;
      programId: number;
      createdAt: string;
      updatedAt: string;
    };
  }[];
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
    campusId: number;
    facultyId: number | null;
    programId: number | null;
    curriculumId: number | null;
    majorId: number | null;
    program: {
      id: number;
      facultyId: number;
      programNameEn: string;
      programNameTh: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  course_section: {
    id: number;
    courseId: number;
    section: string;
    year: number;
    semester: number;
    createdAt: string;
    updatedAt: string;
  };
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
    company: {
      id: 1;
      companyRegisterNumber: string;
      companyNameEn: null;
      companyNameTh: string;
      companyAddress: string;
      companyMap: string;
      companyPhoneNumber: string;
      companyEmail: string;
      companyType: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type EnrollApproveCount = {
  student_enroll_id: number;
  instructors: {
    approved: number;
    total: number;
    allApproved: boolean;
  };
  committee: {
    approved: number;
    rejected: number;
    total: number;
    requiredToPass: number;
    halfOrMoreApproved: boolean;
  };
  overall: {
    passed: boolean;
  };
};
export type EnrollStatus = {
  id: number;
  studentEnrollId: number;
  instructorId: number;
  status: "approve" | "denied" | "pending";
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};
