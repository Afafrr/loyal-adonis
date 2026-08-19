import type { MembershipRole } from '#authorization/roles'
import { MembershipSchema } from '#database/schema'
import Company from '#models/company'
import User from '#models/user'
import Venue from '#models/venue'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Membership extends MembershipSchema {
  declare role: MembershipRole

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => Venue)
  declare venue: BelongsTo<typeof Venue>
}