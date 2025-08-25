import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Student from '#models/student'
// import Staff from '#models/staff'
import Instructor from '#models/instructor'

export default class UserSeeder extends BaseSeeder {
  async run() {
    const student = await User.create({
      email: 'student@gmail.com',
      password: 'password',
      role_id: 3,
    })
    const instructor = await User.createMany([
      {
        email: 'instructor@gmail.com',
        password: 'password',
        role_id: 2,
      },
      {
        email: 'committee_1@gmail.com',
        password: 'password',
        role_id: 2,
      },
      {
        email: 'committee_2@gmail.com',
        password: 'password',
        role_id: 2,
      },
      {
        email: 'committee_3@gmail.com',
        password: 'password',
        role_id: 2,
      },
    ])

    await Student.create({
      user_id: student.id,
      student_id: 'S123456',
      name: 'John',
      middle_name: 'Doe',
      surname: 'Smith',
    })
    await Instructor.createMany(
      instructor.map((user, index) => ({
        user_id: user.id,
        staff_id: `I${index + 1}23456`,
        name: `Instructor ${index + 1}`,
        middle_name: `Middle ${index + 1}`,
        surname: `Surname ${index + 1}`,
        faculty_id: 1,
        program_id: 1,
      }))
    )
  }
}
