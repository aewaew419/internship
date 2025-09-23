import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import StudentEnroll from '#models/student_enroll'

/**
 * GET /reports?year=2568&semester=1&course_id=123&view=summary|detail
 */
export default class ReportsController {
  public async index({ request, response }: HttpContext) {
    try {
      const { year, semester, course_id, view = 'summary' } = request.qs()

      // --- Base QB on enrolls joined to course_sections for filtering ---
      const base = db
        .from('student_enrolls')
        .leftJoin('course_sections', 'student_enrolls.course_section_id', 'course_sections.id')

      if (year) base.where('course_sections.year', Number(year))
      if (semester) base.where('course_sections.semester', Number(semester))
      if (course_id) base.where('course_sections.course_id', Number(course_id))

      if (view === 'detail') {
        // Detailed rows with relations using Lucid (filters via whereHas on course_section)
        const rows = await StudentEnroll.query()
          .preload('student') // adjust to your relation names/columns
          .preload('course_section', (q) =>
            q.select(['id', 'course_id', 'section', 'year', 'semester'])
          )
          .preload('student_training') // if you have it
          .if(Boolean(year), (q) =>
            q.whereHas('course_section', (cq) => cq.where('year', Number(year)))
          )
          .if(Boolean(semester), (q) =>
            q.whereHas('course_section', (cq) => cq.where('semester', Number(semester)))
          )
          .if(Boolean(course_id), (q) =>
            q.whereHas('course_section', (cq) => cq.where('course_id', Number(course_id)))
          )
          .orderBy('id', 'asc')

        return rows
      }

      // --- SUMMARY MODE (default) ---
      // total
      const [{ total }] = await base.clone().count('* as total')
      const totalNum = Number(total ?? 0)

      // by attendance (assumes boolean or tinyint 0/1 in student_enrolls.attend_training)
      const byAttendRaw = await base
        .clone()
        .select('student_enrolls.attend_training')
        .count('* as count')
        .groupBy('student_enrolls.attend_training')

      const byAttendance = {
        attended: Number(
          byAttendRaw.find((r: any) => r.attend_training === 1 || r.attend_training === true)
            ?.count ?? 0
        ),
        not_attended: Number(
          byAttendRaw.find((r: any) => r.attend_training === 0 || r.attend_training === false)
            ?.count ?? 0
        ),
      }

      // grade distribution (assumes student_enrolls.grade exists; string like 'A', 'B+', or numeric)
      const byGradeRaw = await base
        .clone()
        .select('student_enrolls.grade')
        .count('* as count')
        .groupBy('student_enrolls.grade')
        .orderBy('student_enrolls.grade', 'asc')

      const gradeDistribution = byGradeRaw.map((r: any) => ({
        grade: r.grade,
        count: Number(r.count),
      }))

      // by course section (course_id/section/year/semester)
      const bySection = await base
        .clone()
        .select(
          'course_sections.course_id',
          'course_sections.section',
          'course_sections.year',
          'course_sections.semester'
        )
        .count('* as count')
        .groupBy(
          'course_sections.course_id',
          'course_sections.section',
          'course_sections.year',
          'course_sections.semester'
        )
        .orderBy(['course_sections.course_id', 'course_sections.section'])

      // optional: by course (just course_id)
      const byCourse = await base
        .clone()
        .select('course_sections.course_id')
        .count('* as count')
        .groupBy('course_sections.course_id')
        .orderBy('course_sections.course_id')

      return {
        filters: {
          year: year ? Number(year) : null,
          semester: semester ? Number(semester) : null,
          course_id: course_id ? Number(course_id) : null,
        },
        totals: {
          enrollments: totalNum,
          attendance: byAttendance,
        },
        distributions: {
          grades: gradeDistribution,
        },
        breakdowns: {
          by_course_section: bySection.map((r: any) => ({
            course_id: r.course_id,
            section: r.section,
            year: r.year,
            semester: r.semester,
            count: Number(r.count),
          })),
          by_course: byCourse.map((r: any) => ({
            course_id: r.course_id,
            count: Number(r.count),
          })),
        },
      }
    } catch (error) {
      return response.status(500).send({
        message: 'Failed to build report',
        error: String(error?.message ?? error),
      })
    }
  }
}
