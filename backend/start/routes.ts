/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/register', [AuthController, 'register'])
router.post('/login', [AuthController, 'login'])
router.get('/me', [AuthController, 'me']).use(async ({ auth }, next) => {
  await auth.check()
  await next()
})
