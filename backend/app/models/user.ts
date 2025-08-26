import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Role from './role.js'
import Instructor from './instructor.js'
import Student from './student.js'
import Staff from './staff.js'

const AuthFinder = withAuthFinder(() => hash.use('bcrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  public static table = 'users'
  static accessTokens = DbAccessTokensProvider.forModel(User)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role_id: number

  @belongsTo(() => Role, {
    foreignKey: 'role_id',
  })
  declare role: BelongsTo<typeof Role>

  @hasOne(() => Instructor, {
    foreignKey: 'user_id',
  })
  declare instructors: HasOne<typeof Instructor>

  @hasOne(() => Staff, { foreignKey: 'user_id' })
  declare staff: HasOne<typeof Staff>

  @hasOne(() => Student, {
    foreignKey: 'user_id',
  })
  declare students: HasOne<typeof Student>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // async hasRole(roleName: string): Promise<boolean> {
  //   const roles = await this.related('roles').query()
  //   return roles.some((role) => role.name === roleName)
  // }

  // async hasPermission(permissionName: string): Promise<boolean> {
  //   const roles = await this.related('roles').query().preload('permissions')
  //   for (const role of roles) {
  //     if (role.permissions.some((p) => p.name === permissionName)) {
  //       return true
  //     }
  //   }
  //   return false
  // }

  // @beforeSave()
  // static async hashPassword(user: User) {
  //   if (user.$dirty.password) {
  //     user.password = await hash.make(user.password)
  //   }
  // }
}
