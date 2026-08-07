import { getLatestActivity } from '#services/loyalty/get_latest_activity_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class LatestActivityController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return getLatestActivity(Number(user.id))
  }
}
