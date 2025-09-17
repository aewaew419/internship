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
        photos:
          | {
              id: number;
              visitorScheduleId: number;
              photoNo: number;
              fileUrl: string;
              createdAt: string;
              updatedAt: string;
            }[]
          | [];
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
  photos:
    | {
        id: number;
        visitorScheduleId: number;
        photoNo: number;
        fileUrl: string;
        createdAt: string;
        updatedAt: string;
      }[]
    | [];
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
