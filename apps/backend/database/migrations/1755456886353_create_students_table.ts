import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Students extends BaseSchema {
  protected tableName = 'students'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.string('student_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('middle_name')
      table.string('surname').notNullable()
      table.float('gpax')
      table.string('phone_number')
      table.string('picture')
      table.string('email')

      table
        .integer('campus_id')
        .unsigned()
        .references('campuses.id')
        .onDelete('CASCADE')
        .defaultTo(1)
      table
        .integer('faculty_id')
        .unsigned()
        .references('faculties.id')
        .onDelete('CASCADE')
        .nullable()
      table
        .integer('program_id')
        .unsigned()
        .references('programs.id')
        .onDelete('CASCADE')
        .nullable()
      table
        .integer('curriculum_id')
        .unsigned()
        .references('curricula.id')
        .onDelete('CASCADE')
        .nullable()
      table.integer('major_id').unsigned().references('majors.id').onDelete('CASCADE').nullable()

      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
