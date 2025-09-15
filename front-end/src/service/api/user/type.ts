export type UserInterface = {
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
  // "user": {
  //     "id": 1,
  //     "name": "Atip Nomsiri",
  //     "email": "dbixxy@gmail.com"
  // }
};

export type LoginDTO = {
  email: string;
  password: string;
};
export type UserListInterface = {
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
};

export type InstructorInterface = {
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
};
