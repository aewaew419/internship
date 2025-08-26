/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')

// import UserController from '#controllers/users_controller'
import ExcelController from '#controllers/excel_controller'
import CampusesController from '#controllers/campuses_controller'
import FacultiesController from '#controllers/faculties_controller'
import ProgramsController from '#controllers/programs_controller'
import CurriculaController from '#controllers/curricula_controller'
import MajorsController from '#controllers/majors_controller'

import RoleController from '#controllers/roles_controller'
import UserController from '#controllers/users_controller'
import StudentsController from '#controllers/students_controller'
import InstructorsController from '#controllers/instructors_controller'

import CoursesController from '#controllers/courses_controller'
import CourseSectionsController from '#controllers/course_sections_controller'
import InstructorCoursesController from '#controllers/instructor_courses_controller'
import CourseCommitteesController from '#controllers/course_committees_controller'
import StudentEnrollmentsController from '#controllers/student_enrollments_controller'
import StudentEnrollStatusesController from '#controllers/student_enroll_statuses_controller'

import VisitorsController from '#controllers/visitors_controller'
import VisitorSchedulesController from '#controllers/visitor_schedules_controller'

import LetterController from '#controllers/letters_controller'

router.post('/register', [AuthController, 'register'])

router.get('/me', [AuthController, 'me']).use(async ({ auth }, next) => {
  await auth.check()
  await next()
})

router
  .group(() => {
    router.get('/', async () => {
      return {
        hello: 'world',
      }
    })

    router.post('/login', [AuthController, 'login'])

    router.resource('/roles', RoleController).apiOnly()

    router.resource('/students', StudentsController).apiOnly()

    router.resource('/instructors', InstructorsController).apiOnly()

    router.post('/upload-excel', [ExcelController, 'upload'])

    router.resource('/campuses', CampusesController).apiOnly()

    router.resource('/faculties', FacultiesController).apiOnly()

    router.resource('/programs', ProgramsController).apiOnly()

    router.resource('/curricula', CurriculaController).apiOnly()

    router.resource('/majors', MajorsController).apiOnly()

    router.delete('/users/bulk', [UserController, 'bulkDestroy'])

    router.post('/users/bulk-excel', [UserController, 'bulkCreateFromExcel'])
    router.resource('/users', UserController).apiOnly()

    router.get('/course/sections/search', [CourseSectionsController, 'courseYearSemester'])
    router.resource('/course/sections', CourseSectionsController).apiOnly()

    router.delete('/courses/instructor/:course_id/:instructor_id', [
      InstructorCoursesController,
      'destroy',
    ])
    router.delete('/course/committees/:course_id/:instructor_id', [
      CourseCommitteesController,
      'destroy',
    ])
    router.get('/student-enrolls/:id/approval-counts', [
      StudentEnrollStatusesController,
      'getApprovalCountsByEnrollId',
    ])

    router.put('/student_enroll_status/:id', [
      InstructorCoursesController,
      'changeStatusStudentEnroll',
    ])
    router.resource('/courses/instructor', InstructorCoursesController).apiOnly()

    router.resource('/courses/committees', CourseCommitteesController).apiOnly()

    router.post('/course/assign-visitor', [InstructorCoursesController, 'assignVisitorForStudent'])

    router.resource('/courses', CoursesController).apiOnly()
    router.resource('/student/enrollments', StudentEnrollmentsController).apiOnly()
    // router.get('/student/enrollments/:id', [StudentEnrollmentsController, 'show'])

    router.get('/student/enrollment/statuses/instructor/:instructor_id', [
      StudentEnrollStatusesController,
      'getByInstructorId',
    ])
    router.get('/student/enrollment/aprrove', [
      StudentEnrollStatusesController,
      'getStudentEnrollApprove',
    ])
    router.put('/student/enrollment/statuses/all', [
      StudentEnrollStatusesController,
      'updateAllStatus',
    ])
    router.resource('/student/enrollment/statuses', StudentEnrollStatusesController).apiOnly()

    router.get('/visitors/last-visit/:id', [
      VisitorSchedulesController,
      'listStudentsWithLastVisit',
    ])
    router.get('/visitors/schedule_report/:id', [
      VisitorSchedulesController,
      'getVisitorScheduleByID',
    ])
    router.resource('/visitors/schedule', VisitorSchedulesController).apiOnly()
    router.resource('/visitors', VisitorsController).apiOnly()
    router.post('/visitor-trainings/assign-bulk', [
      InstructorCoursesController,
      'bulkAssignVisitorForStudents',
    ])
    router.put('/visitor-trainings/assign', [
      InstructorCoursesController,
      'updateVisitorForStudent',
    ])
    router.delete('/visitor-trainings/:student_enroll_id', [
      InstructorCoursesController,
      'deleteVisitorForStudent',
    ])

    router.get('/letters', [LetterController, 'generateLetter'])
  })
  .prefix('/api/v1')
// .middleware(['auth']) // ล็อกอินก่อนใช้งาน

// router.resource('roles', 'RoleController').apiOnly()
// router.resource('permissions', 'PermissionController').apiOnly()

// router.post('roles/assign-permissions', 'RolePermissionController.assign')
// router.post('users/assign-roles', 'UserRoleController.assign')

// router.post('users/assign-roles', 'UserController.assignRoles')
