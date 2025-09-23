import Permission from '#models/permission'
import type { HttpContext } from '@adonisjs/core/http'

export default class PermissionController {
  async index({}: HttpContext) {
    return Permission.all()
  }

  async store({ request }: HttpContext) {
    const data = request.only(['name'])
    return Permission.create(data)
  }

  async show({ params }: HttpContext) {
    return Permission.findOrFail(params.id)
  }

  async update({ request, params }: HttpContext) {
    const permission = await Permission.findOrFail(params.id)
    const data = request.only(['name'])
    permission.merge(data)
    await permission.save()
    return permission
  }

  async destroy({ params }: HttpContext) {
    const permission = await Permission.findOrFail(params.id)
    await permission.delete()
    return { message: 'Deleted successfully' }
  }
}
