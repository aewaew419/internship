import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'visitor_trainings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('visitor_instructor_id')
        .unsigned()
        .references('instructors.id')
        .onDelete('CASCADE')
      table
        .integer('student_enroll_id')
        .unsigned()
        .references('student_enrolls.id')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
