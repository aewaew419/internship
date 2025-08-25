import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'course_sections'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('course_id').unsigned().references('courses.id').onDelete('CASCADE')
      table.string('section').notNullable().defaultTo('001')
      table.integer('year').notNullable()
      table.integer('semester').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
