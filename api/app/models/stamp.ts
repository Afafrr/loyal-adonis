import { StampSchema } from '#database/schema'
import LoyaltyAccount from '#models/loyalty_account'
import NfcTag from '#models/nfc_tag'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Stamp extends StampSchema {
  @belongsTo(() => LoyaltyAccount)
  declare loyaltyAccount: BelongsTo<typeof LoyaltyAccount>

  @belongsTo(() => NfcTag)
  declare nfcTag: BelongsTo<typeof NfcTag>
}
