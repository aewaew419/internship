import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'visits_pictures'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('visitor_schedule_id')
        .unsigned()
        .references('visitor_schedules.id')
        .onDelete('CASCADE')
        .notNullable()

      table.smallint('photo_no').unsigned().notNullable()
      table.unique(['visitor_schedule_id', 'photo_no'])

      table.string('file_url').notNullable()

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
