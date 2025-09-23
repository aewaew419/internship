import { defineConfig } from '@adonisjs/auth'

import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { InferAuthenticators, InferAuthEvents, Authenticators } from '@adonisjs/auth/types'
import { drivers } from '@adonisjs/core/hash'
import { Bcrypt } from '@adonisjs/hash/drivers/bcrypt'

const authConfig = defineConfig({
  default: 'api',

  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user')
      })
    }),
  },
})



// const authConfig = defineConfig({
//   default: 'api',
//   guards: {
//     api: drivers.bcrypt({
//       provider: {
//         driver: 'lucid',
//         identifierKey: 'id',
//         uids: ['email'], // 👈 ต้องมี email ตรงกับ request
//         model: () => import('#models/user'),
//       },
//     }),
//   },
// })

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}