import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'
import app from '@adonisjs/core/services/app'

export default class StudentsController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Student.findOrFail(id)
      }
      return Student.query().preload('curriculum').preload('major')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only([
        'user_id',
        'student_id',
        'name',
        'middle_name',
        'surname',
        'gpax',
        'phone_number',
        'email',
        'picture',
        'major_id',
        'program_id',
      ])
      await Student.create(data)
      return { message: 'Student created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const student = await Student.findOrFail(params.id)
      const data = request.only([
        'user_id',
        'student_id',
        'name',
        'middle_name',
        'surname',
        'gpax',
        'phone_number',
        'email',
        'program_id',
        'faculty_id',
        'campus_id',
        'curriculum_id',
      ])
      const major = request.input('major_id')

      const picture = request.file('picture', {
        size: '20mb',
        extnames: ['jpg', 'png', 'jpeg'],
      })
      if (picture) {
        // keep file name predictable
        const fileName = `${data.student_id || student.student_id}.${picture.extname}`

        // save into public/uploads/students
        await picture.move(app.makePath('public/uploads/students'), {
          name: fileName,
          overwrite: true,
        })

        // store the public URL path
        console.log(`/uploads/students/${fileName}`)

        student.merge({ picture: `/uploads/students/${fileName}` })
        await student.save()
        return { message: 'Student updated', fileName }
      }

      if (major.major_id) {
        student.merge({ ...data, major_id: major.major_id })
      } else {
        student.merge(data)
      }

      await student.save()
      return { message: 'Student updated', data }
    } catch (error) {
      return error
    }
  }

  async destroy({ params }: HttpContext) {
    try {
      const student = await Student.findOrFail(params.id)
      await student.delete()
      return { message: 'Student deleted' }
    } catch (error) {
      return error
    }
  }
}
