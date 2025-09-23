import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'instructors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.string('staff_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('middle_name')
      table.string('surname').notNullable()
      table.integer('faculty_id').unsigned().references('faculties.id').onDelete('CASCADE')
      table.integer('program_id').unsigned().references('programs.id').onDelete('CASCADE')

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
