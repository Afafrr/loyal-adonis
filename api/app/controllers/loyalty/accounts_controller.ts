import { listLoyaltyAccounts } from '#services/loyalty/list_loyalty_accounts_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoyaltyAccountsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return listLoyaltyAccounts(Number(user.id))
  }
}
