import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Course from './course.js'
import Instructor from './instructor.js'
import Student from './student.js'
import StudentEnroll from './student_enroll.js'

export default class CourseSection extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare course_id: number

  @column()
  declare section: string

  @column()
  declare year: number

  @column()
  declare semester: number

  @belongsTo(() => Course, {
    foreignKey: 'course_id',
  })
  declare course: BelongsTo<typeof Course>

  @manyToMany(() => Instructor, {
    pivotTable: 'course_instructors',
    localKey: 'id', // from course_sections
    pivotForeignKey: 'course_section_id',
    relatedKey: 'id', // from instructors
    pivotRelatedForeignKey: 'instructor_id', // notice plural
  })
  declare course_instructors: ManyToMany<typeof Instructor>

  @manyToMany(() => Instructor, {
    pivotTable: 'course_committees',
    localKey: 'id',
    pivotForeignKey: 'course_section_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'instructor_id',
  })
  declare course_committee: ManyToMany<typeof Instructor>

  @manyToMany(() => Student, {
    pivotTable: 'student_enrolls',
    localKey: 'id',
    pivotForeignKey: 'course_section_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'student_id',
  })
  declare course_students: ManyToMany<typeof Student>

  @hasMany(() => StudentEnroll, {
    foreignKey: 'course_section_id',
  })
  declare student_enrolls: HasMany<typeof StudentEnroll>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
