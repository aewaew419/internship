import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notification_history'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('title', 255).notNullable()
      table.text('body').notNullable()
      table.json('data').nullable() // Additional notification data
      table.string('type', 50).defaultTo('general') // assignment, grade, schedule, etc.
      table.enum('priority', ['low', 'normal', 'high']).defaultTo('normal')
      table.string('image_url', 500).nullable()
      table.string('click_action', 255).nullable()
      table.boolean('is_sent').defaultTo(false)
      table.boolean('is_read').defaultTo(false)
      table.timestamp('sent_at').nullable()
      table.timestamp('read_at').nullable()
      table.json('delivery_status').nullable() // FCM delivery results
      table.integer('retry_count').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      
      // Indexes
      table.index(['user_id', 'is_read'])
      table.index(['user_id', 'type'])
      table.index(['type', 'priority'])
      table.index(['is_sent', 'retry_count'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}