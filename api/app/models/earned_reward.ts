import { EarnedRewardSchema } from '#database/schema'
import LoyaltyAccount from '#models/loyalty_account'
import User from '#models/user'
import Venue from '#models/venue'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class EarnedReward extends EarnedRewardSchema {
  @belongsTo(() => LoyaltyAccount)
  declare loyaltyAccount: BelongsTo<typeof LoyaltyAccount>

  @belongsTo(() => Venue, { foreignKey: 'redeemedAtVenueId' })
  declare redeemedAtVenue: BelongsTo<typeof Venue>

  @belongsTo(() => User, { foreignKey: 'redeemedByUserId' })
  declare redeemedByUser: BelongsTo<typeof User>
}
