export const UNPROTECTED_PATH = {
  // LOGIN: "/token/login",
  LOGIN: "/login",
};
export const PROTECTED_PATH = {
  DASHBOARD: "/",

  USERS: "/users",
  USER_DATA: "/me",
  DELETED_USER: "/users/bulk",
  ADD_USER_XLSX: "/users/bulk-excel",
  ADD_PERSON: "/add-person",
  SETTING: "/setting",

  CAMPUS: "/campus",
  FACULTY: "/faculties",
  PROGRAM: "/programs",
  CURRICULUM: "/curricula",
  MAJOR: "/majors",

  COURSE: "/courses",
  COURSE_SECTION: "/course/sections",
  COURSE_INSTRUCTOR: "/courses/instructor",
  COURSE_COMMITTEE: "/courses/committees",

  INSTRUCTOR: "/instructors",
  INSTRUCTOR_STATUS_PERSON: "/student/enrollment/statuses/instructor/person",
  INSTRUCTOR_INTERN_REQUEST_STATUS: "/student/enrollment/statuses/instructor",
  INSTRUCTOR_CHANGE_STATUS_PERSON: "/student/enrollment/statuses",
  INSTRUCTOR_CHANGE_STATUS_ALL: "/student/enrollment/statuses/all",
  STUDENT_ENROLLMENT_APPROVE: "/student/enrollment/aprrove",
  INSTRUCTOR_ATTEND_GRADE: "/instructor/enrolls/grade",
  INSTRUCTOR_ATTEND_TRAINING: "/instructor/enrolls/attend-train",
  //   STUDENT_ENROLLMENT_APPROVE_COUNT: "/student-enrolls/:id/approval-counts",

  ASSIGN_VISITOR: "/visitor-trainings/assign",

  COURSE_SERCH: "/course/sections/search",

  STUDENT_INFORMATION: "/students",
  STUDENT_ENROLLMENT: "/student/enrollments",
  STUDENT_ENROLLMENT_PICTURE: "/student/enrollments/picture",

  VISITOR_VISITOR_TRAINING_LIST: "/visitors/last-visit",
  VISITOR_VISITOR_SCHEDULE_LIST: "/visitors/schedule",
  VISITOR_ASSIGN_SCHEDULE: "/visitors/schedule",
  VISITOR_VISITOR_SCHEDULE_REPORT: "/visitors/schedule_report",

  VISITOR_EVALUATE_STUDENT: "/visitor/evaluate/student",
  VISITOR_EVALUATE_COMPANY: "/visitor/evaluate/company",
  STUDENT_EVALUATE_COMPANY: "/student/evaluate/company",

  STUDENT_COOP_REQ_LETTER: "/letters/request-coop",
  STUDENT_REFER_LETTER: "/letters/refer-letter",
};
