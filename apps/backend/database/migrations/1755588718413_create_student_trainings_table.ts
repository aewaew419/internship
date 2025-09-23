import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_trainings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('student_enroll_id')
        .unsigned()
        .references('student_enrolls.id')
        .onDelete('CASCADE')
      table.integer('company_id').unsigned().references('companies.id').onDelete('CASCADE')
      table.datetime('start_date').notNullable()
      table.datetime('end_date').notNullable()

      table.enum('document_language', ['en', 'th']).notNullable()

      table.string('coordinator').notNullable()
      table.string('coordinator_phone_number').notNullable()
      table.string('coordinator_email').notNullable()
      table.string('supervisor').notNullable()
      table.string('supervisor_phone_number').notNullable()
      table.string('supervisor_email').notNullable()

      table.string('department').notNullable()
      table.string('position').notNullable()
      table.string('job_description').notNullable()

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
