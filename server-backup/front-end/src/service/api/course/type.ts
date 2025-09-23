export type CourseYearInterface = {
  year: number;
};
export type CourseSemesterInterface = {
  semester: number;
};
export interface CourseSectionInterface<TCourse> {
  id: number;
  courseId: number;
  section: string;
  year: number;
  semester: number;
  createdAt: string;
  updatedAt: string;
  course: TCourse;
}
export interface CourseInstructor
  extends CourseSectionInterface<CourseInterface> {
  course_instructors: InstructorInterface[];
}
export interface CourseCommittee
  extends CourseSectionInterface<CourseInterface> {
  course_committee: InstructorInterface[];
}
export type CourseInterface = {
  id: number;
  courseCode: number;
  courseNameEn: string;
  courseNameTh: string;
  courseInformationEn: string;
  courseInformationTh: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseDTO = {
  course_id: number;
  year: number;
  semester: number;
};

export type InstructorInterface = {
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
  user: {
    id: number;
    roleId: number;
    fullName: string | null;
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
    };
  };
};
export type CourseInstructorDTO = {
  instructor_id: number;
  course_section_id: number;
};
