// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import CourseInstructor from '#models/course_instructor'
import CourseCommittee from '#models/course_committee'
import VisitorTraining from '#models/visitor_training'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = request.only(['email', 'password'])
    const user = await User.create({
      email: request.input('email'),
      password: request.input('password'), // ไม่ต้อง hash ตรงนี้แล้ว
    })
    return response.created(user)
  }

  // async login({ request, auth, response }: HttpContext) {
  //   const { email, password } = request.only(['email', 'password'])

  //   try {
  //     const user = await User.query()
  //       .where('email', email.trim().toLowerCase())
  //       .preload('students')
  //       .preload('instructors')
  //       .firstOrFail()

  //     if (!user) {
  //       return response.unauthorized({ message: 'User not found' })
  //     }

  //     const isPasswordValid = await hash.verify(user.password, password)
  //     if (!isPasswordValid) {
  //       return response.unauthorized({ message: 'Invalid credentials' })
  //     }

  //     //const token = await auth.use('api').attempt(email, password)
  //     // สร้าง token ด้วยการ login โดยตรง
  //     const token = await User.accessTokens.create(user)

  //     return {
  //       token: token,
  //       expiresAt: token.expiresAt,
  //       user,
  //     }
  //   } catch {
  //     // const user = await User.query().where('email', email.trim().toLowerCase()).first()
  //     // const isPasswordValid = await hash.verify(user.password, password)

  //     return response.unauthorized({ message: 'Invalid credentials' })
  //   }
  // }
  public async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.query()
        .where('email', email.trim().toLowerCase())
        // preloads aren’t required for the checks below, but harmless:
        .preload('students', (q) => q.select('id').limit(1))
        .preload('instructors', (q) => q.select('id').limit(1))
        .firstOrFail()

      // verify password (ensure User model hashes in a @beforeSave hook)
      const ok = await hash.verify(user.password, password)
      if (!ok) {
        return response.unauthorized({ message: 'Invalid credentials' })
      }

      // fetch one Instructor row for this user (works whether hasOne or hasMany)
      const instructorRow = await user.related('instructors').query().select('id').first()
      const instructorId = instructorRow?.id ?? null

      // compute sub-roles
      let subroles = { committee: false, visitor: false, courseInstructor: false }
      if (instructorId) {
        const [ci, cc, vt] = await Promise.all([
          CourseInstructor.query().where('instructor_id', instructorId).select('id').first(),
          CourseCommittee.query().where('instructor_id', instructorId).select('id').first(),
          // change to .where('instructor_id', ...) if that’s your actual column
          VisitorTraining.query().where('visitor_instructor_id', instructorId).select('id').first(),
        ])
        subroles = { committee: !!cc, visitor: !!vt, courseInstructor: !!ci }
      }

      // does the user have any student record?
      const hasStudent = !!(await user.related('students').query().select('id').first())

      const roles = {
        student: hasStudent,
        instructor: !!instructorId,
        ...subroles,
        list: Object.entries(subroles)
          .filter(([, v]) => v)
          .map(([k]) => k),
      }

      const token = await User.accessTokens.create(user)

      return {
        token,
        expiresAt: token.expiresAt,
        user,
        roles,
      }
    } catch {
      return response.unauthorized({ message: 'Invalid credentials' })
    }
  }

  async me({ auth }: HttpContext) {
    return auth.user
  }
}
