import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_notification_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable().unique()
      table.boolean('assignment_changes').defaultTo(true)
      table.boolean('grade_updates').defaultTo(true)
      table.boolean('schedule_reminders').defaultTo(true)
      table.boolean('system_announcements').defaultTo(true)
      table.boolean('email_notifications').defaultTo(true)
      table.boolean('push_notifications').defaultTo(true)
      table.json('custom_settings').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}