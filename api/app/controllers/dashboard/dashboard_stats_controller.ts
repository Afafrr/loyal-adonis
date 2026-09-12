import { dashboardQueryValidator } from '#validators/dashboard'
import { getDashboardStats } from '#services/dashboard/get_dashboard_stats_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Serves independently loaded statistics for the business dashboard.
 * The returned aggregates are limited to the caller's authorized business scope.
 */
export default class DashboardStatsController {
  async show({ auth, request, response }: HttpContext) {
    const filters = await dashboardQueryValidator.validate(request.qs())
    const dashboard = await getDashboardStats(Number(auth.getUserOrFail().id), filters)

    if (!dashboard) {
      return response.forbidden({ error: 'You do not have access to a business dashboard.' })
    }

    if ('companySelectionRequired' in dashboard) {
      return response.conflict({
        code: 'COMPANY_SELECTION_REQUIRED',
        error: 'Select a company before loading dashboard statistics.',
      })
    }

    return dashboard
  }
}
