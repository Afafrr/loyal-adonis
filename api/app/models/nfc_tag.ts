import { NfcTagSchema } from '#database/schema'
import Stamp from '#models/stamp'
import Venue from '#models/venue'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class NfcTag extends NfcTagSchema {
  @belongsTo(() => Venue)
  declare venue: BelongsTo<typeof Venue>

  @hasMany(() => Stamp)
  declare stamps: HasMany<typeof Stamp>
}
