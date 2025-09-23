import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Roles extends BaseSchema {
  protected tableName = 'roles'

  async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.string('description').nullable()
      table.timestamps(true)
    })
  }

  async down () {
    this.schema.dropTable(this.tableName)
  }
}
