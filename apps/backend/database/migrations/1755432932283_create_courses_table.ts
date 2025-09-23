import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'courses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('course_code').notNullable().unique()
      table.string('course_name_en').notNullable()
      table.string('course_name_th').notNullable()
      table.string('course_information_en')
      table.string('course_information_th')

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
