import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class RegistrationsController {
  async store({ request, auth, response }: HttpContext) {
    const { user: payload } = await request.validateUsing(signupValidator)
    const user = await User.create({
      email: payload.email,
      encryptedPassword: payload.password,
    })

    await auth.use('web').login(user)

    response.status(201)
    return {
      id: Number(user.id),
      email: user.email,
      created_at: user.createdAt.toISO(),
      updated_at: user.updatedAt.toISO(),
    }
  }
}
