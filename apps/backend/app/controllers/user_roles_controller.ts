import User from '#models/user'
import Role from '#models/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class UserRoleController {
  async assign({ request }: HttpContext) {
    const { userId, roleIds } = request.only(['userId', 'roleIds'])

    const user = await User.findOrFail(userId)
    await user.related('roles').sync(roleIds)

    return { message: 'Roles assigned to user successfully' }
  }
}
