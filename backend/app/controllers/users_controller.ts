import db from '@adonisjs/lucid/services/db'
import * as XLSX from 'xlsx'

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

  // async assignRoles({ request }: HttpContext) {
  //   const { userId, roleIds } = request.only(['userId', 'roleIds'])
  //   const user = await User.findOrFail(userId)
  //   await user.related('roles').sync(roleIds)
  //   return { message: 'Roles assigned successfully' }
  // }
  public async bulkCreateFromExcel({ request, response }: HttpContext) {
    // 1) get file
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

    // 2) read workbook
    const wb = XLSX.readFile(file.tmpPath!) // tmpPath provided by Adonis upload
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' }) // array of objects

    // 3) optional global role_id from request
    const globalRoleId = request.input('role_id') // optional

    const created: any[] = []
    const skipped: Array<{ email: string; reason: string }> = []
    const errors: Array<{ email?: string; reason: string }> = []

    const trx = await db.transaction()
    try {
      for (const [idx, row] of rows.entries()) {
        try {
          // Normalize + validate core fields
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

          // Check duplicate user by email
          const dup = await User.query({ client: trx }).where('email', email).first()
          if (dup) {
            skipped.push({ email, reason: 'Email already exists' })
            continue
          }

          // Compose fullName (optional)
          const fullName =
            row.fullName ||
            [row.name, row.middle_name, row.surname].filter(Boolean).join(' ').trim()

          // Create user
          const user = await User.create(
            {
              email,
              password,
              role_id: roleId,
              fullName: fullName || null,
            },
            { client: trx }
          )

          // Role-specific record
          if (roleId === 3) {
            // STUDENT
            // required: student_id, name, surname (adjust to your schema)
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
              },
              { client: trx }
            )
          } else if (roleId === 2) {
            // INSTRUCTOR
            // required: staff_id, name, surname, faculty_id, program_id
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
            // required: staff_id
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
            // Unknown role
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
}
