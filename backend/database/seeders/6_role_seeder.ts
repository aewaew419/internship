import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    const roles = [
      {
        name: 'Admin',
      },
      {
        name: 'Instructor',
      },
      {
        name: 'Student',
      },
    ]

    await Role.createMany(roles)
  }
}
