import Role from '#models/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class RoleController {
  async index({}: HttpContext) {
    return Role.all()
  }

  async store({ request }: HttpContext) {
    const data = request.only(['name'])
    return Role.create(data)
  }

  async show({ params }: HttpContext) {
    return Role.findOrFail(params.id)
  }

  async update({ request, params }: HttpContext) {
    const role = await Role.findOrFail(params.id)
    const data = request.only(['name'])
    role.merge(data)
    await role.save()
    return role
  }

  async destroy({ params }: HttpContext) {
    const role = await Role.findOrFail(params.id)
    await role.delete()
    return { message: 'Deleted successfully' }
  }
}
