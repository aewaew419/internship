export const UNPROTECTED_PATH = {
  LOGIN: "/login",
  STUDENT_LOGIN: "/auth/student-login",
  ADMIN_LOGIN: "/admin/login",
  REGISTER: "/register",
  CHECK_STUDENT_ID: "/check-student-id",
  CHECK_EMAIL: "/check-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

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

  ASSIGN_VISITOR: "/visitor-trainings/assign",

  COURSE_SERCH: "/course/sections/search",

  STUDENT_INFORMATION: "/students",
  STUDENT_ENROLLMENT: "/student/enrollments",
  STUDENT_ENROLLMENT_PICTURE: "/student/enrollments/picture",

  VISITOR_VISITOR_TRAINING_LIST: "/visitors/last-visit",
  VISITOR_VISITOR_SCHEDULE_LIST: "/visitors/schedule",
  VISITOR_ASSIGN_SCHEDULE: "/visitors/schedule",
  VISITOR_ASSIGN_SCHEDULE_PICTURE: "/visitors/schedule/picture",
  VISITOR_VISITOR_SCHEDULE_REPORT: "/visitors/schedule_report",

  VISITOR_EVALUATE_STUDENT: "/visitor/evaluate/student",
  VISITOR_EVALUATE_COMPANY: "/visitor/evaluate/company",
  STUDENT_EVALUATE_COMPANY: "/student/evaluate/company",

  STUDENT_COOP_REQ_LETTER: "/letters/request-coop",
  STUDENT_REFER_LETTER: "/letters/refer-letter",
  
  REPORTS: "/reports",

  // Notification endpoints
  NOTIFICATIONS: "/notifications",
  NOTIFICATIONS_MARK_READ: "/notifications/mark-read",
  NOTIFICATIONS_MARK_ALL_READ: "/notifications/mark-all-read",
  NOTIFICATIONS_DELETE: "/notifications/delete",
  NOTIFICATIONS_BULK: "/notifications/bulk",
  NOTIFICATIONS_SETTINGS: "/notifications/settings",
  NOTIFICATIONS_PUSH_SUBSCRIBE: "/notifications/push/subscribe",
  NOTIFICATIONS_PUSH_UNSUBSCRIBE: "/notifications/push/unsubscribe",
  NOTIFICATIONS_TEST: "/notifications/test",
  NOTIFICATIONS_STATS: "/notifications/stats",
  
  // Notification engagement analytics endpoints
  NOTIFICATIONS_ENGAGEMENT_EVENTS: "/notifications/engagement/events",
  NOTIFICATIONS_ENGAGEMENT_REPORT: "/notifications/engagement/report",
  NOTIFICATIONS_ENGAGEMENT_USERS: "/notifications/engagement/users",
  NOTIFICATIONS_ENGAGEMENT_TYPES: "/notifications/engagement/types",
  NOTIFICATIONS_ENGAGEMENT_OPTIMIZE: "/notifications/engagement/optimize",
  NOTIFICATIONS_ENGAGEMENT_AB_TESTS: "/notifications/engagement/ab-tests",
  NOTIFICATIONS_ENGAGEMENT_HEATMAP: "/notifications/engagement/heatmap",
  NOTIFICATIONS_ENGAGEMENT_EXPORT: "/notifications/engagement/export",
  NOTIFICATIONS_ENGAGEMENT_REALTIME: "/notifications/engagement/realtime",
} as const;