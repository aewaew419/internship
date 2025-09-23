import Role from '#models/role'
import Permission from '#models/permission'
import type { HttpContext } from '@adonisjs/core/http'

export default class RolePermissionController {
  async assign({ request }: HttpContext) {
    const { roleId, permissionIds } = request.only(['roleId', 'permissionIds'])

    const role = await Role.findOrFail(roleId)
    await role.related('permissions').sync(permissionIds)

    return { message: 'Permissions assigned to role successfully' }
  }
}
