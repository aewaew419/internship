import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_enroll_statuses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add instructor assignment history tracking
      table.json('instructor_assignment_history')

      // Add indexes for performance optimization
      table.index(['instructor_id'], 'idx_student_enroll_statuses_instructor_id')
      table.index(['student_enroll_id'], 'idx_student_enroll_statuses_student_enroll_id')
    })
  }

  async down() {
    // this.schema.alterTable(this.tableName, (table) => {
    //   // Drop indexes
    //   table.dropIndex(['instructor_id'], 'idx_student_enroll_statuses_instructor_id')
    //   table.dropIndex(['student_enroll_id'], 'idx_student_enroll_statuses_student_enroll_id')
    // Remove instructor assignment history column
    // table.dropColumn('instructor_assignment_history')
    // })
  }
}
