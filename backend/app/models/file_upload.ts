import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class FileUpload extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare originalName: string

  @column()
  declare fileName: string

  @column()
  declare filePath: string

  @column()
  declare mimeType: string

  @column()
  declare fileSize: number

  @column()
  declare fileHash: string | null

  @column()
  declare thumbnailPath: string | null

  @column()
  declare category: string

  @column()
  declare metadata: Record<string, any> | null

  @column()
  declare isPublic: boolean

  @column()
  declare isProcessed: boolean

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Get file URL
   */
  get url(): string {
    return `/uploads/${this.fileName}`
  }

  /**
   * Get thumbnail URL
   */
  get thumbnailUrl(): string | null {
    return this.thumbnailPath ? `/uploads/thumbnails/${this.fileName}` : null
  }

  /**
   * Check if file is expired
   */
  get isExpired(): boolean {
    return this.expiresAt ? DateTime.now() > this.expiresAt : false
  }

  /**
   * Get human readable file size
   */
  get humanFileSize(): string {
    const bytes = this.fileSize
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}