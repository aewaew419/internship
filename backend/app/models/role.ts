import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import Permission from './permission'
import User from './user'
import type { HasManyToMany } from '@adonisjs/lucid/types/relations'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @manyToMany(() => Permission, { pivotTable: 'role_permission' })
  declare permissions: HasManyToMany<typeof Permission>

  @manyToMany(() => User, {
    pivotTable: 'user_role',
  })
  declare users: ManyToMany<typeof User>
}
