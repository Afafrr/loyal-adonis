import VerifyTagService from '#services/nfc/verify_tag_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class TagScanController {
  async show({ request, response }: HttpContext) {
    const query = request.qs()
    const required = ['picc_data', 'enc', 'cmac'] as const

    for (const field of required) {
      if (typeof query[field] !== 'string' || query[field].trim().length === 0) {
        return response.badRequest({ error: `Missing required parameter: ${field}` })
      }
    }

    const upstream = await new VerifyTagService({
      piccData: query.picc_data,
      enc: query.enc,
      cmac: query.cmac,
    }).call()

    response.status(upstream.status)
    response.type('text/plain')
    return response.send(upstream.body)
  }
}
