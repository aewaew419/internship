import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'file_uploads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('original_name', 255).notNullable()
      table.string('file_name', 255).notNullable().unique()
      table.string('file_path', 500).notNullable()
      table.string('mime_type', 100).notNullable()
      table.bigInteger('file_size').notNullable() // in bytes
      table.string('file_hash', 64).nullable() // SHA-256 hash for deduplication
      table.string('thumbnail_path', 500).nullable()
      table.string('category', 50).defaultTo('general') // document, image, etc.
      table.json('metadata').nullable() // Additional file metadata
      table.boolean('is_public').defaultTo(false)
      table.boolean('is_processed').defaultTo(true) // For async processing
      table.timestamp('expires_at').nullable() // For temporary files
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      
      // Indexes
      table.index(['user_id', 'category'])
      table.index(['mime_type', 'is_public'])
      table.index(['file_hash'])
      table.index(['expires_at'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}