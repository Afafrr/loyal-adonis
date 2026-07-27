import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return { id: Number(user.id), email: user.email }
  }
}
