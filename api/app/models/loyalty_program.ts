import { LoyaltyProgramSchema } from '#database/schema'
import Company from '#models/company'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class LoyaltyProgram extends LoyaltyProgramSchema {
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>
}
