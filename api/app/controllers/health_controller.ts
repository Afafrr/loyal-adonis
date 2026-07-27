import { DateTime } from 'luxon'

export default class HealthController {
  show() {
    return {
      status: 'up',
      timestamp: DateTime.utc().toISO(),
    }
  }
}
