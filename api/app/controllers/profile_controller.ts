import { getUserProfile } from '#services/profile/get_user_profile_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return getUserProfile(user)
  }
}
