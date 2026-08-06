import { listAvailableRewards } from '#services/loyalty/list_available_rewards_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoyaltyRewardsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return listAvailableRewards(Number(user.id))
  }
}
