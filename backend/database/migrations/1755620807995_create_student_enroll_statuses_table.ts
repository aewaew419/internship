import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_enroll_statuses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('student_enroll_id')
        .unsigned()
        .references('student_enrolls.id')
        .onDelete('CASCADE')
      table.integer('instructor_id').unsigned().references('instructors.id').onDelete('CASCADE')
      table.enum('status', ['approve', 'denied', 'pending']).notNullable()
      table.string('remarks')

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
