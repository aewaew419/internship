import User from '#models/user'
import Role from '#models/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class UserController {
  async index({}: HttpContext) {
    return User.query().preload('roles')
  }

  async show({ params }: HttpContext) {
    return User.query().where('id', params.id).preload('roles').firstOrFail()
  }

  async store({ request }: HttpContext) {
    const data = request.only(['email', 'password', 'fullName'])
    return await User.create(data)
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

  async assignRoles({ request }: HttpContext) {
    const { userId, roleIds } = request.only(['userId', 'roleIds'])
    const user = await User.findOrFail(userId)
    await user.related('roles').sync(roleIds)
    return { message: 'Roles assigned successfully' }
  }
}
