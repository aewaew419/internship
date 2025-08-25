import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
// import Permission from './permission.js'
import User from './user.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  // @manyToMany(() => Permission, { pivotTable: 'role_permission' })
  // declare permissions: ManyToMany<typeof Permission>

  @hasMany(() => User, {
    foreignKey: 'role_id',
  })
  declare users: HasMany<typeof User>
}
