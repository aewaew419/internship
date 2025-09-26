import type {
  StudentEnrollInterface,
  StudentTrainingType,
} from "../student/type";
export type InstructorStudentEnrollStatusInterface = {
  id: number;
  studentEnrollId: number;
  instructorId: number;
  status: "approve" | "denied" | "pending";
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  student_enroll: StudentEnrollInterface;
  student_training: StudentTrainingType;
};
export type InstructorInterface = {
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
