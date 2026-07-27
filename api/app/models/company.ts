import { CompanySchema } from '#database/schema'
import LoyaltyProgram from '#models/loyalty_program'
import Venue from '#models/venue'
import { hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'

export default class Company extends CompanySchema {
  @hasMany(() => Venue)
  declare venues: HasMany<typeof Venue>

  @hasOne(() => LoyaltyProgram)
  declare loyaltyProgram: HasOne<typeof LoyaltyProgram>
}
