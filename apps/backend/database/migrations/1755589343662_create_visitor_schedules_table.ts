import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'visitor_schedules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('visitor_training_id')
        .unsigned()
        .references('visitor_trainings.id')
        .onDelete('CASCADE')
        .notNullable()

      table.integer('visit_no').unsigned().notNullable()
      table.unique(['visitor_training_id', 'visit_no'])

      table.dateTime('visit_at', { useTz: true }).notNullable()

      table.string('comment').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
