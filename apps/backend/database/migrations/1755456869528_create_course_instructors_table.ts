import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'course_instructors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('course_section_id')
        .unsigned()
        .references('course_sections.id')
        .onDelete('CASCADE')
      table.integer('instructor_id').unsigned().references('instructors.id').onDelete('CASCADE')

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
