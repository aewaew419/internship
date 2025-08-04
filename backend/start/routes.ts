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

router
  .group(() => {
    router.resource('roles', 'RoleController').apiOnly()
    router.resource('permissions', 'PermissionController').apiOnly()

    router.post('roles/assign-permissions', 'RolePermissionController.assign')
    router.post('users/assign-roles', 'UserRoleController.assign')

    router.resource('users', 'UserController').apiOnly()
    router.post('users/assign-roles', 'UserController.assignRoles')
  })
  .prefix('/api')
  .middleware(['auth']) // ล็อกอินก่อนใช้งาน
