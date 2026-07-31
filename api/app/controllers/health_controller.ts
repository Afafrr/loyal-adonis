import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  show({ request, response }: HttpContext) {
    response.header('X-CSRF-Token', request.csrfToken)

    return {
      status: 'up',
      timestamp: DateTime.utc().toISO(),
    }
  }
}
