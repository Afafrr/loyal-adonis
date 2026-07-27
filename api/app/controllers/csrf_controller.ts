import type { HttpContext } from '@adonisjs/core/http'

export default class CsrfController {
  show({ request }: HttpContext) {
    return { csrf_token: request.csrfToken }
  }
}
