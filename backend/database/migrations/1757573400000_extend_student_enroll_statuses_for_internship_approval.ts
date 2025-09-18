import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_enroll_statuses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Update status enum to include new internship approval statuses
      table.dropColumn('status')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', [
          'registered', // Initial application
          'advisor_approved', // Advisor approved
          'committee_approved', // Committee approved
          'document_approved', // Document approved
          'document_cancelled', // Cancelled after approval
          'approve', // Legacy status
          'denied', // Legacy status
          'pending', // Legacy status
        ])
        .notNullable()
        .defaultTo('registered')

      // Committee voting tracking fields
      table.json('committee_votes')

      table.integer('committee_vote_count').defaultTo(0)
      table.integer('required_committee_votes').defaultTo(3)
      table.dateTime('committee_voting_deadline').nullable()

      // Status transition tracking
      table.json('status_history')
    })
  }

  async down() {
    // this.schema.alterTable(this.tableName, (table) => {
    //   // Remove new columns
    //   table.dropColumn('committee_votes')
    //   table.dropColumn('committee_vote_count')
    //   table.dropColumn('required_committee_votes')
    //   table.dropColumn('committee_voting_deadline')
    //   table.dropColumn('status_history')
    //   table.dropColumn('status')
    // })
    // this.schema.alterTable(this.tableName, (table) => {
    //   // Restore original status enum
    //   table.enum('status', ['approve', 'denied', 'pending']).notNullable()
    // })
  }
}
