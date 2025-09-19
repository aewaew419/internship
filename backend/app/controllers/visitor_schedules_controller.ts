import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { promises as fs } from 'node:fs'
import VisitorSchedule from '#models/visitor_schedule'
import VisitorTraining from '#models/visitor_training'
import VisitsPicture from '#models/visits_pictures'

const toArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

export default class VisitorSchedulesController {
  async index({}) {
    return VisitorSchedule.all()
  }
  async getVisitorScheduleByID({ params }: HttpContext) {
    const schedule = await VisitorSchedule.query().where('id', params.id).preload('photos').first()
    return schedule
  }

  async show({ params }: HttpContext) {
    const schedule = await VisitorTraining.query()
      .where('id', params.id)
      .preload('schedules', (q) => q.preload('photos'))
      .preload('studentEnroll', (q) => q.preload('student'))
      .firstOrFail()
    return schedule
  }

  async store({ request }: HttpContext) {
    try {
      const { visitor_training_id, visit_no, visit_at, comment } = request.only([
        'visitor_training_id',
        'visit_no',
        'visit_at',
        'comment',
      ])
      const schedule = await VisitorSchedule.create({
        visitor_training_id: visitor_training_id,
        visit_no: visit_no,
        visit_at: visit_at,
        comment: comment,
      })
      return schedule
    } catch (error) {
      return error
    }
  }
  async update({ request, params: { id } }: HttpContext) {
    try {
      const { visitor_training_id, visit_no, visit_at, comment } = request.only([
        'visitor_training_id',
        'visit_no',
        'visit_at',
        'comment',
      ])
      const schedule = await VisitorSchedule.findOrFail(id)

      schedule.visitor_training_id = visitor_training_id
      schedule.visit_no = visit_no
      schedule.visit_at = visit_at
      schedule.comment = comment
      await schedule.save()
      return schedule
    } catch (error) {
      return error
    }
  }
  public async upsertPhotos({ request, params: { id }, response }: HttpContext) {
    const schedule = await VisitorSchedule.findOrFail(id)

    const files = request.files('photos', {
      size: '20mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    const photoNos = toArray(request.input('photo_nos') as string[] | string)
      .map((n) => Number(n))
      .filter(Number.isFinite)

    const deleteNos = toArray(request.input('delete_photo_nos') as string[] | string)
      .map((n) => Number(n))
      .filter(Number.isFinite)

    // 1) Deletions
    if (deleteNos.length) {
      const old = await VisitsPicture.query()
        .where('visitorScheduleId', schedule.id)
        .whereIn('photoNo', deleteNos)

      for (const p of old) {
        try {
          const abs = app.makePath('public', p.fileUrl.replace(/^\/?/, ''))
          await fs.unlink(abs)
        } catch {}
      }
      await VisitsPicture.query()
        .where('visitorScheduleId', schedule.id)
        .whereIn('photoNo', deleteNos)
        .delete()
    }

    // 2) Replacements
    if (files.length !== photoNos.length) {
      return response.badRequest({ error: 'photos[] and photo_nos[] length mismatch' })
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const no = photoNos[i]

      if (!f?.isValid) continue

      const dir = app.makePath('public/uploads/visitor_schedules', String(schedule.id))
      const fileName = `visit${schedule.visit_no ?? 'x'}_p${no}.${f.extname}`
      await f.move(dir, { name: fileName, overwrite: true })

      const publicPath = `uploads/visitor_schedules/${schedule.id}/${fileName}`

      const existing = await VisitsPicture.query()
        .where('visitorScheduleId', schedule.id)
        .andWhere('photoNo', no)
        .first()

      if (existing) {
        if (existing.fileUrl !== publicPath) {
          try {
            const absOld = app.makePath('public', existing.fileUrl.replace(/^\/?/, ''))
            await fs.unlink(absOld)
          } catch {}
        }
        existing.merge({ fileUrl: publicPath })
        await existing.save()
      } else {
        await VisitsPicture.create({
          visitorScheduleId: schedule.id,
          photoNo: no,
          fileUrl: publicPath,
        })
      }
    }

    await schedule.load('photos', (q) => q.orderBy('photoNo', 'asc'))
    return schedule
  }

  public async listStudentsWithLastVisit({ params }: HttpContext) {
    const visitorId = Number(params.id)

    const trainings = await VisitorTraining.query()
      .where('visitor_instructor_id', visitorId)
      .preload('studentEnroll', (q) => q.preload('student')) // -> student_enroll.student
      .preload('schedules', (q) => q.orderBy('visit_no', 'desc')) // latest first

    return trainings
  }
}
