import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'
import CourseSection from '#models/course_section'

import StudentEnroll from '#models/student_enroll'
import StudentTraining from '#models/student_training'
import Company from '#models/company'
import CompanyPicture from '#models/company_picture'
import StudentEnrollStatus from '#models/student_enroll_status'
import StudentEvaluateCompany from '#models/student_evaluate_company'

import app from '@adonisjs/core/services/app'
import fs from 'fs/promises'

export default class StudentEnrollmentsController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return StudentEnroll.query()
          .where('id', id)
          .preload('student_training', (query) => {
            query.preload('company', (q) => q.preload('company_picture'))
          })
          .preload('visitor_training', (query) => {
            query.preload('visitor')
          })
          .preload('student', (query) => {
            query.preload('faculty').preload('program')
          })
          .preload('course_section', (query) => {
            query.preload('course').orderBy('year', 'desc')
          })
          .firstOrFail()
      }
      return StudentEnroll.query()
        .preload('student')
        .preload('course_section', (query) => {
          query.preload('course').orderBy('year', 'desc')
        })
    } catch (error) {
      return error
    }
  }
  async show({ params }: HttpContext) {
    try {
      return StudentEnroll.query()
        .where('student_id', params.id)
        .preload('student')
        .preload('course_section', (query) => {
          query.preload('course').orderBy('year', 'desc')
        })
        .preload('student_training', (query) =>
          query.preload('company', (q) => q.preload('company_picture'))
        )
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only(['student_id', 'course_section_id'])
      const student = await Student.findOrFail(data.student_id)
      const course = await CourseSection.findOrFail(data.course_section_id)
      if (!student || !course) {
        return { message: 'Student or course not found' }
      }

      const studentEnroll = await StudentEnroll.create(data)
      const companyData = request.only([
        'company_register_number',
        'company_name_en',
        'company_name_th',
        'company_address',
        'company_map',
        'company_email',
        'company_phone_number',
        'company_type',
      ])
      const company = await Company.create(companyData)
      await CompanyPicture.createMany([
        { company_id: company.id, picture: null },
        { company_id: company.id, picture: null },
      ])

      const studentEnrollId = studentEnroll.id
      const companyId = company.id
      const trainingData = request.only([
        'document_language',
        'start_date',
        'end_date',
        'coordinator',
        'coordinator_phone_number',
        'coordinator_email',
        'supervisor',
        'supervisor_phone_number',
        'supervisor_email',
        'department',
        'position',
        'job_description',
      ])

      const studentTraining = await StudentTraining.create({
        ...trainingData,
        student_enroll_id: studentEnrollId,
        company_id: companyId,
      })
      const DEFAULT_STUDENT_EVAL_QUESTIONS = [
        'ความเหมาะสมของลักษณะงานกับสาขาวิชาที่เรียน',
        'ความเป็นมิตรและให้ความร่วมมือของพนักงาน',
        'สภาพแวดล้อมในการทำงาน (ความสะอาด ปลอดภัย)',
        'ความชัดเจนในการมอบหมายงาน',
        'โอกาสในการเรียนรู้และพัฒนาทักษะระหว่างการฝึกงาน',
      ]
      const existing = await StudentEvaluateCompany.query().where(
        'student_training_id',
        studentTraining.id
      )

      if (existing.length === 0) {
        await StudentEvaluateCompany.createMany(
          DEFAULT_STUDENT_EVAL_QUESTIONS.map((q) => ({
            student_training_id: studentTraining.id,
            questions: q,
          }))
        )
      }
      const courseInstructors = await CourseSection.query()
        .where('id', data.course_section_id)
        .preload('course_instructors', (query) => {
          query.select('id')
        })
        .preload('course_committee', (query) => {
          query.select('id')
        })
        .firstOrFail()

      await StudentEnrollStatus.createMany(
        courseInstructors.course_instructors.map((instructor) => ({
          student_enroll_id: studentEnrollId,
          instructor_id: instructor.id,
          status: 'pending',
        }))
      )
      await StudentEnrollStatus.createMany(
        courseInstructors.course_committee.map((instructor) => ({
          student_enroll_id: studentEnrollId,
          instructor_id: instructor.id,
          status: 'pending',
        }))
      )
      return { message: 'Student enrollment created', id: studentEnroll.id }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const enrollment = await StudentEnroll.query()
        .where('id', params.id)
        .preload('student_training', (query) => {
          query.preload('company')
        })
        .firstOrFail()
      //   const data = request.only(['student_id', 'course_section_id'])

      const companyData = request.only([
        'company_register_number',
        'company_name_en',
        'company_name_th',
        'company_address',
        'company_map',
        'company_email',
        'company_phone_number',
        'company_type',
      ])
      let companyId = enrollment.student_training.company_id
      let company = await Company.findBy('id', companyId)
      if (company) {
        company.merge(companyData)
        await company.save()
      } else {
        company = await Company.create(companyData)
        companyId = company.id
        await enrollment.save()
      }
      const trainingData = request.only([
        'document_language',
        'start_date',
        'end_date',
        'coordinator',
        'coordinator_phone_number',
        'coordinator_email',
        'supervisor',
        'supervisor_phone_number',
        'supervisor_email',
        'department',
        'position',
        'job_description',
      ])

      let training = await StudentTraining.findBy('student_enroll_id', enrollment.id)
      if (training) {
        training.merge({
          ...trainingData,
          company_id: company.id,
        })
        await training.save()
      } else {
        await StudentTraining.create({
          ...trainingData,
          student_enroll_id: enrollment.id,
          company_id: company.id,
        })
      }

      //   enrollment.merge(data)
      await enrollment.save()
      return { message: 'Student enrollment updated' }
    } catch (error) {
      return error
    }
  }

  public async updatePicture({ request, params, response }: HttpContext) {
    const enrollment = await StudentEnroll.query()
      .where('id', params.id)
      .preload('student')
      .preload('student_training', (q) => q.preload('company', (c) => c.preload('company_picture')))
      .firstOrFail()

    // exactly one file must be sent
    const pic1 = request.file('picture_1', { size: '2mb', extnames: ['jpg', 'png', 'jpeg'] })
    const pic2 = request.file('picture_2', { size: '2mb', extnames: ['jpg', 'png', 'jpeg'] })

    if (!pic1 && !pic2) return response.badRequest({ message: 'No file provided' })
    if (pic1 && pic2) return response.badRequest({ message: 'Send only one file per request' })

    const slot: 1 | 2 = pic1 ? 1 : 2
    const file = pic1 ?? pic2!
    const dir = app.makePath('public/uploads/companies')
    await fs.mkdir(dir, { recursive: true })

    const fileName = `${enrollment.student.student_id}_pic${slot}.${file.extname}`
    await file.move(dir, { name: fileName, overwrite: true })

    const company = enrollment.student_training.company
    // current rows (ordered by id so index 0=first slot, 1=second slot)
    const rows = [...company.company_picture].sort((a, b) => a.id - b.id)

    // Update only the requested slot
    const webPath = `/uploads/companies/${fileName}`
    const existingRow = rows[slot - 1]
    if (existingRow) {
      existingRow.merge({ picture: webPath })
      await existingRow.save()
    } else {
      // create the Nth row if it doesn't exist yet
      await company.related('company_picture').create({ picture: webPath })
    }

    return {
      message: 'Updated',
      slot,
      url: `/${webPath}`,
    }
  }
  async destroy({ params }: HttpContext) {
    try {
      const enrollment = await StudentEnroll.findOrFail(params.id)
      await enrollment.delete()
      return { message: 'Student enrollment deleted' }
    } catch (error) {
      return error
    }
  }
}
