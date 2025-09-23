import type { HttpContext } from '@adonisjs/core/http'
import StudentEnroll from '#models/student_enroll'

export default class InstructorGradesController {
  public async index({}: HttpContext) {
    return await StudentEnroll.all()
  }
  public async getStudentGrade({ params }: HttpContext) {
    return await StudentEnroll.query().where('id', params.id).firstOrFail()
  }

  public async updateGrade({ request, params }: HttpContext) {
    const studentEnroll = await StudentEnroll.findOrFail(params.id)
    const data = request.only(['grade'])
    studentEnroll.merge(data)
    await studentEnroll.save()
    return studentEnroll
  }
  public async updateAttendTraining({ request, params }: HttpContext) {
    const studentEnroll = await StudentEnroll.findOrFail(params.id)
    const data = request.only(['attend_training'])
    studentEnroll.merge(data)
    await studentEnroll.save()
    return studentEnroll
  }

  public async bulkUpdateGrade({ request, response }: HttpContext) {
    const { ids, grade } = request.only(['ids', 'grade']) as {
      ids: number[]
      grade: string
    }

    if (!Array.isArray(ids) || ids.length === 0 || !grade?.trim()) {
      return response.badRequest({ message: 'ids[] and non-empty grade are required' })
    }

    const updated = await StudentEnroll.query().whereIn('id', ids).update({ grade })
    return { updated, ids }
  }

  public async bulkUpdateAttendTraining({ request, response }: HttpContext) {
    const { ids, grade } = request.only(['ids', 'grade']) as {
      ids: number[]
      grade: string
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ message: 'ids[] is required' })
    }

    const updated = await StudentEnroll.query().whereIn('id', ids).update({
      attend_training: grade,
    })

    return { updated, ids }
  }
}
