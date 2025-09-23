import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('company_register_number').notNullable()
      table.string('company_name_en')
      table.string('company_name_th').notNullable()
      table.string('company_address').notNullable()
      table.string('company_map').notNullable()
      table.string('company_phone_number').notNullable()
      table.string('company_email').notNullable()
      table.string('company_type').notNullable()

      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
