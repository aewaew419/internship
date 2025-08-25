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
};
