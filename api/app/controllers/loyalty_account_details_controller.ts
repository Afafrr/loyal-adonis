import { getLoyaltyAccountDetail } from '#services/loyalty/get_loyalty_account_detail_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const loyaltyAccountParamsSchema = vine.object({
  loyaltyAccountId: vine.number().positive().withoutDecimals(),
})

export default class LoyaltyAccountDetailsController {
  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { loyaltyAccountId } = await vine.validate({
      schema: loyaltyAccountParamsSchema,
      data: params,
    })
    const detail = await getLoyaltyAccountDetail(Number(user.id), loyaltyAccountId)

    if (!detail) {
      return response.notFound({ error: 'Loyalty account not found.' })
    }

    return detail
  }
}
