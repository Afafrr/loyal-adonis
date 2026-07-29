/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthController = () => import('#controllers/health_controller')
const RegistrationsController = () => import('#controllers/registrations_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const TagScanController = () => import('#controllers/tag_scan_controller')
const UsersController = () => import('#controllers/users_controller')

router.get('/up', [HealthController, 'show']).as('health')

router
  .group(() => {
    router.post('users', [RegistrationsController, 'store']).as('users.register')
    router.post('users/sign_in', [SessionsController, 'store']).as('users.signIn')

    // Protected routes
    router
      .group(() => {
        router.delete('users/sign_out', [SessionsController, 'destroy']).as('users.signOut')
        router.get('me', [UsersController, 'show']).as('users.me')
        router.get('tag_scan', [TagScanController, 'show']).as('tagScan')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
