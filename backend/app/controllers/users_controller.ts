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
}
