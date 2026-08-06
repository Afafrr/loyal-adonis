import { tagScanValidator } from '#validators/tag_scan'
import { recordTagScan } from '#services/nfc/record_tag_scan_service'
import { verifyTag } from '#services/nfc/verify_tag_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class TagScanController {
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(tagScanValidator)

    const upstream = await verifyTag({
      piccData: payload.picc_data,
      enc: payload.enc,
      cmac: payload.cmac,
    })

    if (!upstream.tag) {
      return response.badRequest({ error: 'Unable to verify the NFC tag.' })
    }

    const scan = await recordTagScan({
      userId: auth.getUserOrFail().id,
      tagIdentifier: upstream.tag.identifier,
      readCounter: upstream.tag.readCounter,
    })

    return response.created(scan)
  }
}
