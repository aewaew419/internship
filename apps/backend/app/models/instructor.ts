import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Faculty from './faculty.js'
import Program from './program.js'
import CourseSection from './course_section.js'
import StudentEnrollStatus from './student_enroll_status.js'

export default class Instructor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare staff_id: string

  @column()
  declare name: string

  @column()
  declare middle_name: string

  @column()
  declare surname: string

  @column()
  declare faculty_id: number

  @column()
  declare program_id: number

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Faculty, {
    foreignKey: 'faculty_id',
  })
  declare faculty: BelongsTo<typeof Faculty>

  @belongsTo(() => Program, {
    foreignKey: 'program_id',
  })
  declare program: BelongsTo<typeof Program>

  @manyToMany(() => CourseSection, {
    pivotTable: 'course_instructors',
    localKey: 'id', // from instructors
    pivotForeignKey: 'instructor_id',
    relatedKey: 'id', // from course_sections
    pivotRelatedForeignKey: 'course_section_id', // notice plural
  })
  declare course_instructors: ManyToMany<typeof CourseSection>

  @manyToMany(() => CourseSection, {
    pivotTable: 'course_committees',
    localKey: 'id',
    pivotForeignKey: 'instructor_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'course_section_id',
  })
  declare course_committee: ManyToMany<typeof CourseSection>

  @hasMany(() => StudentEnrollStatus, {
    foreignKey: 'instructor_id',
  })
  declare student_enroll_statuses: HasMany<typeof StudentEnrollStatus>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
