import Company from '#models/company'
import Membership from '#models/membership'
import { membershipRoles } from '#authorization/roles'
import CompanyPolicy from '#policies/company_policy'
import { getOwnerDashboard } from '#services/owner/get_owner_dashboard_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class OwnerDashboardController {
  async show({ auth, bouncer, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const membership = await Membership.query()
      .where('user_id', Number(user.id))
      .where('role', membershipRoles.companyOwner)
      .first()

    if (!membership?.companyId) {
      return response.forbidden({ error: 'You do not have access to an owner dashboard.' })
    }

    const company = await Company.findOrFail(membership.companyId)
    await bouncer.with(CompanyPolicy).authorize('view', company)

    return getOwnerDashboard(Number(user.id))
  }
}
