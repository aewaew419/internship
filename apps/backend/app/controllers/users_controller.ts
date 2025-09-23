import db from '@adonisjs/lucid/services/db'
import * as XLSX from 'xlsx'
import fs from 'node:fs/promises'

import User from '#models/user'
import Student from '#models/student'
import Instructor from '#models/instructor'
import Staff from '#models/staff'
// import Role from '#models/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class UserController {
  async index({}: HttpContext) {
    return User.query().preload('instructors').preload('students').preload('role')
  }

  async show({ params }: HttpContext) {
    return User.query().where('id', params.id)
  }

  async store({ request }: HttpContext) {
    const data = request.only(['email', 'password', 'fullName', 'role_id'])
    const user = await User.create(data)
    if (user.role_id === 3) {
      const student = request.only(['student_id', 'name', 'middle_name', 'surname'])
      await Student.create({ user_id: user.id, ...student })
    } else if (user.role_id === 2) {
      const instructor = request.only([
        'staff_id',
        'name',
        'middle_name',
        'surname',
        'faculty_id',
        'program_id',
      ])
      await Instructor.create({ user_id: user.id, ...instructor })
    } else if (user.role_id === 1) {
      await Staff.create({ user_id: user.id })
    }
    return user
  }

  async update({ request, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = request.only(['fullName'])
    user.merge(data)
    await user.save()
    return user
  }

  async destroy({ params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return { message: 'User deleted' }
  }
  public async bulkCreateFromExcel({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: '10mb',
      extnames: ['xlsx', 'xls'],
    })

    if (!file) {
      return response.badRequest({ message: 'file is required' })
    }
    if (!file.isValid) {
      return response.badRequest({ message: 'Invalid file', errors: file.errors })
    }

    // --- read upload into Buffer and parse with XLSX.read ---
    let rows: any[] = []
    try {
      // Prefer tmpPath if BodyParser wrote to disk
      let buf: Buffer
      if (file.tmpPath) {
        buf = await fs.readFile(file.tmpPath)
      } else if (typeof (file as any).toBuffer === 'function') {
        // some Adonis versions expose toBuffer()
        buf = await (file as any).toBuffer()
      } else {
        return response.badRequest({ message: 'Cannot read uploaded file (no tmpPath / toBuffer)' })
      }

      const wb = XLSX.read(buf, { type: 'buffer' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
    } catch (err) {
      return response.badRequest({ message: 'Failed to parse Excel file', error: String(err) })
    }

    // optional global role_id
    const globalRoleId = request.input('role_id')

    const created: any[] = []
    const skipped: Array<{ email: string; reason: string }> = []
    const errors: Array<{ email?: string; reason: string }> = []

    const trx = await db.transaction()
    try {
      for (const [idx, row] of rows.entries()) {
        try {
          const email = String(row.email || '')
            .trim()
            .toLowerCase()
          const password = String(row.password || '').trim()
          const roleId = Number(row.role_id || globalRoleId)

          if (!email || !password || !roleId) {
            skipped.push({
              email,
              reason: `Row ${idx + 2}: missing required fields (email/password/role_id).`,
            })
            continue
          }

          const dup = await User.query({ client: trx }).where('email', email).first()
          if (dup) {
            skipped.push({ email, reason: 'Email already exists' })
            continue
          }

          const fullName =
            row.fullName ||
            [row.name, row.middle_name, row.surname].filter(Boolean).join(' ').trim()

          const user = await User.create(
            {
              email,
              password,
              role_id: roleId,
              fullName: fullName || null,
            },
            { client: trx }
          )

          if (roleId === 3) {
            // STUDENT
            if (!row.student_id || !row.name || !row.surname) {
              throw new Error(`Row ${idx + 2}: missing student fields (student_id, name, surname)`)
            }
            await Student.create(
              {
                user_id: user.id,
                student_id: String(row.student_id),
                name: String(row.name),
                middle_name: String(row.middle_name || ''),
                surname: String(row.surname),
                major_id: Number(row.major_id) || null,
                program_id: Number(row.program_id) || null,
                curriculum_id: Number(row.curriculum_id) || null,
                faculty_id: Number(row.faculty_id) || null,
              },
              { client: trx }
            )
          } else if (roleId === 2) {
            // INSTRUCTOR
            if (!row.staff_id || !row.name || !row.surname || !row.faculty_id || !row.program_id) {
              throw new Error(
                `Row ${idx + 2}: missing instructor fields (staff_id, name, surname, faculty_id, program_id)`
              )
            }
            await Instructor.create(
              {
                user_id: user.id,
                staff_id: String(row.staff_id),
                name: String(row.name),
                middle_name: String(row.middle_name || ''),
                surname: String(row.surname),
                faculty_id: Number(row.faculty_id),
                program_id: Number(row.program_id),
              },
              { client: trx }
            )
          } else if (roleId === 1) {
            // STAFF
            if (!row.staff_id) {
              throw new Error(`Row ${idx + 2}: missing staff fields (staff_id)`)
            }
            await Staff.create(
              {
                user_id: user.id,
                staff_id: String(row.staff_id),
              },
              { client: trx }
            )
          } else {
            throw new Error(`Row ${idx + 2}: unsupported role_id ${roleId}`)
          }

          created.push({ email, role_id: roleId })
        } catch (e: any) {
          errors.push({ email: row?.email, reason: e?.message || String(e) })
        }
      }

      await trx.commit()
      return { created_count: created.length, skipped, errors }
    } catch (fatal: any) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Bulk create failed',
        error: fatal?.message || String(fatal),
        created,
        skipped,
        errors,
      })
    }
  }
  public async bulkDestroy({ request, response, auth }: HttpContext) {
    // ids can be in body OR query; normalize
    const raw = request.input('ids')
    const ids: number[] = Array.isArray(raw)
      ? raw.map(Number).filter(Number.isFinite)
      : String(raw ?? '')
          .split(',')
          .map((v) => Number(v.trim()))
          .filter(Number.isFinite)

    if (ids.length === 0) {
      return response.badRequest({ message: 'ids must be a non-empty array' })
    }

    const meId = auth?.user?.id
    const filteredIds = ids.filter((id) => id !== meId)

    const existing = await User.query().whereIn('id', filteredIds).select('id', 'role_id')
    const existingIds = existing.map((u) => u.id)
    const missingIds = filteredIds.filter((id) => !existingIds.includes(id))

    if (existingIds.length === 0) {
      return {
        message: 'No users deleted',
        deleted_count: 0,
        missing_ids: missingIds,
        skipped_self: meId && ids.includes(meId) ? [meId] : [],
      }
    }

    // group by role
    const studentUserIds = existing.filter((u) => u.role_id === 3).map((u) => u.id)
    const instructorUserIds = existing.filter((u) => u.role_id === 2).map((u) => u.id)
    const staffUserIds = existing.filter((u) => u.role_id === 1).map((u) => u.id)

    const trx = await db.transaction()
    try {
      // Delete only what’s needed, and only if the table exists
      const knex = db.connection()

      if (studentUserIds.length) {
        await Student.query({ client: trx }).whereIn('user_id', studentUserIds).delete()
      }

      if (instructorUserIds.length) {
        await Instructor.query({ client: trx }).whereIn('user_id', instructorUserIds).delete()
      }

      if (staffUserIds.length) {
        const hasStaffTable = await knex.schema.hasTable(Staff.table) // Staff.table uses your static table name
        if (hasStaffTable) {
          await Staff.query({ client: trx }).whereIn('user_id', staffUserIds).delete()
        }
        // else: silently skip if the table truly doesn’t exist
      }

      const deleted = await User.query({ client: trx }).whereIn('id', existingIds).delete()

      await trx.commit()
      return {
        message: 'Users deleted',
        deleted_count: deleted,
        deleted_ids: existingIds,
        missing_ids: missingIds,
        skipped_self: meId && ids.includes(meId) ? [meId] : [],
      }
    } catch (err) {
      await trx.rollback()
      return response.status(500).send({ message: 'Bulk delete failed', error: String(err) })
    }
  }
}
