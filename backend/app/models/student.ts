import { BaseModel, column, belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'

import Major from './major.js'
import Curriculum from './curriculum.js'
import Program from './program.js'
import Faculty from './faculty.js'
import Campus from './campus.js'

import CourseSection from './course_section.js'

import StudentEnroll from './student_enroll.js'

export default class Student extends BaseModel {
  public static table = 'students'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare name: string

  @column()
  declare middle_name: string

  @column()
  declare surname: string

  @column()
  declare student_id: string

  @column()
  declare gpax: number

  @column()
  declare phone_number: string

  @column()
  declare email: string

  @column()
  declare picture: string

  @column()
  declare major_id: number

  @belongsTo(() => Major, {
    foreignKey: 'major_id',
  })
  declare major: BelongsTo<typeof Major>

  @column()
  declare program_id: number

  @belongsTo(() => Program, {
    foreignKey: 'program_id',
  })
  declare program: BelongsTo<typeof Program>

  @column()
  declare curriculum_id: number

  @belongsTo(() => Curriculum, {
    foreignKey: 'curriculum_id',
  })
  declare curriculum: BelongsTo<typeof Curriculum>

  @column()
  declare faculty_id: number

  @belongsTo(() => Faculty, {
    foreignKey: 'faculty_id',
  })
  declare faculty: BelongsTo<typeof Faculty>

  @column()
  declare campus_id: number

  @belongsTo(() => Campus, {
    foreignKey: 'campus_id',
  })
  declare campus: BelongsTo<typeof Campus>

  @hasMany(() => StudentEnroll, {
    foreignKey: 'student_id',
  })
  declare student_enrolls: HasMany<typeof StudentEnroll>

  @manyToMany(() => CourseSection, {
    pivotTable: 'student_enrolls',
    localKey: 'id', // from students
    pivotForeignKey: 'student_id',
    relatedKey: 'id', // from course_sections
    pivotRelatedForeignKey: 'course_section_id', // notice plural
  })
  declare course_sections: ManyToMany<typeof CourseSection>
}
