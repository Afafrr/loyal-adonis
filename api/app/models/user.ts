import { UserSchema } from '#database/schema'
import LoyaltyAccount from '#models/loyalty_account'
import Membership from '#models/membership'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { beforeSave, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class User extends compose(
  UserSchema,
  withAuthFinder(hash, {
    uids: ['email'],
    passwordColumnName: 'encryptedPassword',
  })
) {
  @hasMany(() => LoyaltyAccount)
  declare loyaltyAccounts: HasMany<typeof LoyaltyAccount>

  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>

  @beforeSave()
  static normalizeEmail(user: User) {
    user.email = user.email.trim().toLowerCase()
  }
}
