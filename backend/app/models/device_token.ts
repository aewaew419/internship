import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class DeviceToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare token: string

  @column()
  declare platform: 'ios' | 'android' | 'web'

  @column()
  declare isActive: boolean

  @column()
  declare deviceInfo: string | null

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Mark token as used
   */
  async markAsUsed() {
    this.lastUsedAt = DateTime.now()
    await this.save()
  }

  /**
   * Deactivate token
   */
  async deactivate() {
    this.isActive = false
    await this.save()
  }
}