import LoyaltyAccount from '#models/loyalty_account'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoyaltyAccountsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const loyaltyAccounts = await LoyaltyAccount.query()
      .where('user_id', Number(user.id))
      .preload('loyaltyProgram', (loyaltyProgramQuery) => {
        loyaltyProgramQuery.preload('company')
      })
      .preload('stamps', (stampQuery) => {
        stampQuery.orderBy('created_at', 'asc').preload('nfcTag', (nfcTagQuery) => nfcTagQuery.preload('venue'))
      })

    return {
      loyaltyAccounts: loyaltyAccounts.map((loyaltyAccount) => {
        const { loyaltyProgram } = loyaltyAccount
        const { company } = loyaltyProgram

        const locations = new Map<number, { id: number; name: string; firstScannedAt: string }>()

        for (const stamp of loyaltyAccount.stamps) {
          const venue = stamp.nfcTag.venue
          const venueId = Number(venue.id)

          if (!locations.has(venueId)) {
            locations.set(venueId, {
              id: venueId,
              name: venue.name,
              firstScannedAt: stamp.createdAt.toISO()!,
            })
          }
        }

        return {
          id: Number(loyaltyAccount.id),
          program: {
            id: Number(loyaltyProgram.id),
            name: loyaltyProgram.name,
            rewardTitle: loyaltyProgram.rewardTitle,
            stampsRequired: loyaltyProgram.stampsRequired,
            stampCount: loyaltyAccount.stamps.length,
          },
          company: {
            id: Number(company.id),
            name: company.name,
          },
          locations: [...locations.values()],
        }
      })
      .sort((firstAccount, secondAccount) => {
        const firstScan = firstAccount.locations[0]?.firstScannedAt ?? ''
        const secondScan = secondAccount.locations[0]?.firstScannedAt ?? ''
        return firstScan.localeCompare(secondScan)
      }),
    }
  }
}
