import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async store({ request, auth, response }: HttpContext) {
    const { user: payload } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(payload.email, payload.password)

    await auth.use('web').login(user)

    response.status(201)
    response.header('Location', '/')
    return {
      id: Number(user.id),
      email: user.email,
      created_at: user.createdAt.toISO(),
      updated_at: user.updatedAt.toISO(),
    }
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.noContent()
  }
}
