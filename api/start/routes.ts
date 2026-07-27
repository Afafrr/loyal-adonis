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

const CsrfController = () => import('#controllers/csrf_controller')
const HealthController = () => import('#controllers/health_controller')
const RegistrationsController = () => import('#controllers/registrations_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const TagScanController = () => import('#controllers/tag_scan_controller')
const UsersController = () => import('#controllers/users_controller')

router.get('/up', [HealthController, 'show']).as('health')

router
  .group(() => {
    router.get('csrf', [CsrfController, 'show']).as('csrf')

    router.post('users', [RegistrationsController, 'store']).as('users.register')
    router.post('users/sign_in', [SessionsController, 'store']).as('users.signIn')
    router
      .delete('users/sign_out', [SessionsController, 'destroy'])
      .use(middleware.auth())
      .as('users.signOut')

    router.get('me', [UsersController, 'show']).use(middleware.auth()).as('users.me')
    router.get('tag_scan', [TagScanController, 'show']).use(middleware.auth()).as('tagScan')
  })
  .prefix('/api/v1')
