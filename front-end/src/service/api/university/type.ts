export type CampusInterface = {
  id: number;
  campusNameEn: string;
  campusNameTh: string;
  createdAt: string;
  updatedAt: string;
  faculties: FaculyInterface[];
};
export type FaculyInterface = {
  id: number;
  campusId: number;
  facultyNameEn: string;
  facultyNameTh: string;
  campus: CampusInterface;
  program: ProgramInterface[];
};
export type ProgramInterface = {
  id: number;
  facultyId: number;
  programNameEn: string;
  programNameTh: string;
  createdAt: string;
  updatedAt: string;
  faculty: FaculyInterface;
  curriculum: CurriculumInterface[];
};
export type CurriculumInterface = {
  id: number;
  programId: number;
  curriculumNameEn: string;
  curriculumNameTh: string;
  createdAt: string;
  updatedAt: string;
  program: ProgramInterface[];
  majors: MajorInterface[];
};
export type MajorInterface = {
  id: number;
  curriculumId: number;
  majorNameEn: string;
  majorNameTh: string;
  createdAt: string;
  updatedAt: string;
  curriculum: CurriculumInterface;
};
