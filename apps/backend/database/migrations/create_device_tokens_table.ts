import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'device_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('token', 500).notNullable().unique()
      table.enum('platform', ['ios', 'android', 'web']).notNullable()
      table.boolean('is_active').defaultTo(true)
      table.string('device_info', 1000).nullable() // JSON string for device information
      table.timestamp('last_used_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      
      // Indexes
      table.index(['user_id', 'is_active'])
      table.index(['platform', 'is_active'])
      table.index('token')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}