import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_enrolls'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('student_id').unsigned().references('students.id').onDelete('CASCADE')
      table
        .integer('course_section_id')
        .unsigned()
        .references('course_sections.id')
        .onDelete('CASCADE')

      table.integer('grade')

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
