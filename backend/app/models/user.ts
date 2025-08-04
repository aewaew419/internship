import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Role from './role'

const AuthFinder = withAuthFinder(() => hash.use('bcrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  public static table = 'users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @manyToMany(() => Role, {
    pivotTable: 'user_role',
  })
  declare roles: ManyToMany<typeof Role>

  async hasRole(roleName: string): Promise<boolean> {
    const roles = await this.related('roles').query()
    return roles.some((role) => role.name === roleName)
  }

  async hasPermission(permissionName: string): Promise<boolean> {
    const roles = await this.related('roles').query().preload('permissions')
    for (const role of roles) {
      if (role.permissions.some((p) => p.name === permissionName)) {
        return true
      }
    }
    return false
  }

  // @beforeSave()
  // static async hashPassword(user: User) {
  //   if (user.$dirty.password) {
  //     user.password = await hash.make(user.password)
  //   }
  // }
}
