// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = request.only(['email', 'password'])
    const user = await User.create({
      email: request.input('email'),
      password: request.input('password'), // ไม่ต้อง hash ตรงนี้แล้ว
    })
    return response.created(user)
  }

  async login({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.query()
        .where('email', email.trim().toLowerCase())
        .preload('students')
        .preload('instructors')
        .firstOrFail()

      if (!user) {
        return response.unauthorized({ message: 'User not found' })
      }

      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.unauthorized({ message: 'Invalid credentials' })
      }

      //const token = await auth.use('api').attempt(email, password)
      // สร้าง token ด้วยการ login โดยตรง
      const token = await User.accessTokens.create(user)

      return {
        token: token,
        expiresAt: token.expiresAt,
        user,
      }
    } catch {
      // const user = await User.query().where('email', email.trim().toLowerCase()).first()
      // const isPasswordValid = await hash.verify(user.password, password)

      return response.unauthorized({ message: 'Invalid credentials' })
    }
  }

  async me({ auth }: HttpContext) {
    return auth.user
  }
}
