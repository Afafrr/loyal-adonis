import env from '#start/env'
import { verifyTag } from '#services/nfc/verify_tag_service'
import { tagScanValidator } from '#validators/tag_scan'
import type { HttpContext } from '@adonisjs/core/http'

export default class DevelopmentNfcTagsController {
  async inspect({ request, response }: HttpContext) {
    if (env.get('NODE_ENV') === 'production') {
      return response.notFound()
    }

    const payload = await request.validateUsing(tagScanValidator)
    const upstream = await verifyTag({
      piccData: payload.picc_data,
      enc: payload.enc,
      cmac: payload.cmac,
    })

    if (!upstream.tag) {
      return response.badRequest({ error: 'Unable to verify the NFC tag.' })
    }

    return { tag: upstream.tag }
  }
}
