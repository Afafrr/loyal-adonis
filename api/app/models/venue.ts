import { VenueSchema } from '#database/schema'
import Company from '#models/company'
import NfcTag from '#models/nfc_tag'
import Membership from '#models/membership'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Venue extends VenueSchema {
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @hasMany(() => NfcTag)
  declare nfcTags: HasMany<typeof NfcTag>

  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>
}
