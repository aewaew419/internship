import type { HttpContext } from '@adonisjs/core/http'
import VisitorTraining from '#models/visitor_training'
import db from '@adonisjs/lucid/services/db'

export default class VisitorsController {
  public async index({}: HttpContext) {
    // Get visitor trainings with evaluation status for company evaluations
    const visitorTrainings = await db
      .from('visitor_trainings as vt')
      .leftJoin('student_enrolls as se', 'vt.student_enroll_id', 'se.id')
      .leftJoin('students as s', 'se.student_id', 's.id')
      .leftJoin('student_trainings as st', 'se.id', 'st.student_enroll_id')
      .leftJoin('companies as c', 'st.company_id', 'c.id')
      .leftJoin('visitor_schedules as vs', 'vt.id', 'vs.visitor_training_id')
      .leftJoin('visitor_evaluate_companies as vec', 'vt.id', 'vec.visitor_training_id')
      .leftJoin('instructors as i', 'vt.visitor_instructor_id', 'i.id')
      .select(
        'vt.id',
        'vt.visitor_instructor_id as visitorInstructorId',
        'vt.student_enroll_id as studentEnrollId',
        'vt.created_at as createdAt',
        'vt.updated_at as updatedAt',
        'se.id as studentEnrollId',
        'se.student_id as studentId',
        'se.course_section_id as courseSectionId',
        'se.grade',
        'se.created_at as enrollCreatedAt',
        'se.updated_at as enrollUpdatedAt',
        's.id as studentIdPk',
        's.user_id as userId',
        's.student_id as studentIdCode',
        's.name',
        's.middle_name as middleName',
        's.surname',
        's.gpax',
        's.phone_number as phoneNumber',
        's.picture',
        's.email',
        's.campus_id as campusId',
        's.faculty_id as facultyId',
        's.program_id as programId',
        's.curriculum_id as curriculumId',
        's.major_id as majorId',
        'i.id as instructorId',
        'i.user_id as instructorUserId',
        'i.instructor_id as instructorIdCode',
        'i.name as instructorName',
        'i.middle_name as instructorMiddleName',
        'i.surname as instructorSurname',
        'i.phone_number as instructorPhoneNumber',
        'i.email as instructorEmail',
        db.raw('COUNT(DISTINCT vs.id) as scheduleCount'),
        db.raw('COUNT(DISTINCT vec.id) as evaluationCount'),
        db.raw(`
          CASE 
            WHEN COUNT(DISTINCT vec.id) > 0 AND MIN(vec.score) > 0 THEN 'ประเมินแล้ว'
            ELSE 'ยังไม่ประเมิน'
          END as evaluationStatus
        `)
      )
      .groupBy(
        'vt.id',
        'vt.visitor_instructor_id',
        'vt.student_enroll_id',
        'vt.created_at',
        'vt.updated_at',
        'se.id',
        'se.student_id',
        'se.course_section_id',
        'se.grade',
        'se.created_at',
        'se.updated_at',
        's.id',
        's.user_id',
        's.student_id',
        's.name',
        's.middle_name',
        's.surname',
        's.gpax',
        's.phone_number',
        's.picture',
        's.email',
        's.campus_id',
        's.faculty_id',
        's.program_id',
        's.curriculum_id',
        's.major_id',
        'i.id',
        'i.user_id',
        'i.instructor_id',
        'i.name',
        'i.middle_name',
        'i.surname',
        'i.phone_number',
        'i.email'
      )

    // Transform to match frontend interface
    const transformedData = visitorTrainings.map((training: any) => ({
      id: training.id,
      visitorInstructorId: training.visitorInstructorId,
      studentEnrollId: training.studentEnrollId,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
      evaluationStatus: training.evaluationStatus,
      evaluationCount: training.evaluationCount,
      scheduleCount: training.scheduleCount,
      studentEnroll: {
        id: training.studentEnrollId,
        studentId: training.studentId,
        courseSectionId: training.courseSectionId,
        grade: training.grade,
        createdAt: training.enrollCreatedAt,
        updatedAt: training.enrollUpdatedAt,
        student: {
          id: training.studentIdPk,
          userId: training.userId,
          studentId: training.studentIdCode,
          name: training.name,
          middleName: training.middleName,
          surname: training.surname,
          gpax: training.gpax,
          phoneNumber: training.phoneNumber,
          picture: training.picture,
          email: training.email,
          campusId: training.campusId,
          facultyId: training.facultyId,
          programId: training.programId,
          curriculumId: training.curriculumId,
          majorId: training.majorId,
        },
      },
      visitor: training.instructorId ? {
        id: training.instructorId,
        userId: training.instructorUserId,
        instructorId: training.instructorIdCode,
        name: training.instructorName,
        middleName: training.instructorMiddleName,
        surname: training.instructorSurname,
        phoneNumber: training.instructorPhoneNumber,
        email: training.instructorEmail,
      } : null,
      schedules: []
    }))

    return transformedData
  }
  public async show({ params }: HttpContext) {
    const visitor = await VisitorTraining.query()
      .where('visitor_instructor_id', params.id)
      .preload('studentEnroll', (q) => {
        q.preload('student')
        q.preload('student_training', (trainingQuery) => {
          trainingQuery.preload('company')
        })
      })
      .preload('visitor')
      .preload('schedules')
    return visitor
  }
}
