import { getDashboard } from '#services/dashboard/get_dashboard_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Serves the business dashboard for platform admins, company owners, and venue employees.
 * The customer loyalty dashboard uses the separate `/api/v1/me/*` endpoints.
 */
export default class DashboardController {
  async show({ auth, response }: HttpContext) {
    const dashboard = await getDashboard(Number(auth.getUserOrFail().id))

    if (!dashboard) {
      return response.forbidden({ error: 'You do not have access to a business dashboard.' })
    }

    return dashboard
  }
}
