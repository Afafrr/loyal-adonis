import Membership from '#models/membership'
import { membershipRoles } from '#authorization/roles'
import { getOwnerDashboardStats } from '#services/owner/get_owner_dashboard_stats_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class OwnerDashboardStatsController {
  async show({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const membership = await Membership.query()
      .where('user_id', Number(user.id))
      .where('role', membershipRoles.companyOwner)
      .first()

    if (!membership?.companyId) {
      return response.forbidden({ error: 'You do not have access to an owner dashboard.' })
    }

    return getOwnerDashboardStats(Number(user.id))
  }
}
