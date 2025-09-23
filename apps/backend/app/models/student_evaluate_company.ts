import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import StudentTraining from './student_training.js'

export default class StudentEvaluateCompany extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare score: number

  @column()
  declare questions: string

  @column()
  declare comment: string

  @column()
  declare student_training_id: number

  @belongsTo(() => StudentTraining, {
    foreignKey: 'student_training_id',
  })
  declare student_training: BelongsTo<typeof StudentTraining>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Check if evaluation exists for a student training ID
   * @param studentTrainingId - The student training ID to check
   * @returns Promise<boolean> - True if evaluation exists, false otherwise
   */
  static async hasEvaluated(studentTrainingId: number): Promise<boolean> {
    const evaluation = await this.query()
      .where('student_training_id', studentTrainingId)
      .first()
    
    return evaluation !== null
  }

  /**
   * Get evaluation with company information for a student training ID
   * @param studentTrainingId - The student training ID to get evaluation for
   * @returns Promise<StudentEvaluateCompany | null> - Evaluation with company info or null
   */
  static async getEvaluationWithCompany(studentTrainingId: number): Promise<StudentEvaluateCompany | null> {
    const evaluation = await this.query()
      .where('student_training_id', studentTrainingId)
      .preload('student_training', (query) => {
        query.preload('company')
      })
      .first()
    
    return evaluation
  }
}
