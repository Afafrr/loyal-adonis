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
const LatestActivityController = () => import('#controllers/latest_activity_controller')
const LoyaltyAccountsController = () => import('#controllers/loyalty/accounts_controller')
const LoyaltyAccountDetailsController = () =>
  import('#controllers/loyalty/account_details_controller')
const LoyaltyRewardsController = () => import('#controllers/loyalty/rewards_controller')
const DevelopmentNfcTagsController = () =>
  import('#controllers/nfc/development_nfc_tags_controller')
const RegistrationsController = () => import('#controllers/auth/registrations_controller')
const ProfileController = () => import('#controllers/profile_controller')
const SessionsController = () => import('#controllers/auth/sessions_controller')
const TagScanController = () => import('#controllers/nfc/tag_scan_controller')
const UsersController = () => import('#controllers/users_controller')
const DashboardController = () => import('#controllers/dashboard/dashboard_controller')
const DashboardStatsController = () => import('#controllers/dashboard/dashboard_stats_controller')

router.get('/up', [HealthController, 'show']).as('health')

router
  .group(() => {
    router.post('users', [RegistrationsController, 'store']).as('users.register')
    router.post('users/sign_in', [SessionsController, 'store']).as('users.signIn')

    // Protected routes
    router
      .group(() => {
        router.delete('users/sign_out', [SessionsController, 'destroy']).as('users.signOut')

        router
          .group(() => {
            router.get('/', [UsersController, 'show']).as('users.me')
            router.get('profile', [ProfileController, 'show']).as('profile.show')
            router
              .get('latest_activity', [LatestActivityController, 'show'])
              .as('latestActivity.show')
            router
              .get('loyalty_accounts', [LoyaltyAccountsController, 'index'])
              .as('loyaltyAccounts.index')
            router
              .get('loyalty_accounts/:loyaltyAccountId', [LoyaltyAccountDetailsController, 'show'])
              .as('loyaltyAccounts.show')
            router
              .get('loyalty_rewards', [LoyaltyRewardsController, 'index'])
              .as('loyaltyRewards.index')
          })
          .prefix('me')

        router
          .group(() => {
            router.get('dashboard', [DashboardController, 'show']).as('business.dashboard.show')
            router
              .get('dashboard/stats', [DashboardStatsController, 'show'])
              .as('business.dashboard.stats')
          })
          .prefix('business')

        router
          .post('dev/nfc_tags/inspect', [DevelopmentNfcTagsController, 'inspect'])
          .as('developmentNfcTags.inspect')
        router.post('tag_scans', [TagScanController, 'store']).as('tagScans.create')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
