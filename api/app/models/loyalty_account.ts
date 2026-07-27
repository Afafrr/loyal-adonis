import { LoyaltyAccountSchema } from '#database/schema'
import LoyaltyProgram from '#models/loyalty_program'
import Stamp from '#models/stamp'
import User from '#models/user'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class LoyaltyAccount extends LoyaltyAccountSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => LoyaltyProgram)
  declare loyaltyProgram: BelongsTo<typeof LoyaltyProgram>

  @hasMany(() => Stamp)
  declare stamps: HasMany<typeof Stamp>
}
