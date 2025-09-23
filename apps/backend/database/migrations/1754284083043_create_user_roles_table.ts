import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UserRole extends BaseSchema {
  protected tableName = 'user_role'

  async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')
      table.primary(['user_id', 'role_id'])
    })
  }

  async down () {
    this.schema.dropTable(this.tableName)
  }
}
