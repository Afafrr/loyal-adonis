import LoyaltyAccount from '#models/loyalty_account'
import Stamp from '#models/stamp'
import Venue from '#models/venue'

export async function getLoyaltyAccountDetail(userId: number, loyaltyAccountId: number) {
  const loyaltyAccount = await LoyaltyAccount.query()
    .where('id', loyaltyAccountId)
    .where('user_id', userId)
    .withCount('stamps')
    .preload('loyaltyProgram', (loyaltyProgramQuery) => loyaltyProgramQuery.preload('company'))
    .preload('earnedRewards', (earnedRewardQuery) =>
      earnedRewardQuery.orderBy('earned_at', 'desc').orderBy('id', 'desc')
    )
    .preload('stamps', (stampQuery) =>
      stampQuery
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc')
        .limit(5)
        .preload('nfcTag', (nfcTagQuery) => nfcTagQuery.preload('venue'))
    )
    .first()

  if (!loyaltyAccount) {
    return null
  }

  const { loyaltyProgram } = loyaltyAccount
  const { company } = loyaltyProgram
  const companyId = Number(company.id)
  const totalStampCount = Number(loyaltyAccount.$extras.stamps_count)
  const allocatedStampCount = loyaltyAccount.earnedRewards.reduce(
    (total, reward) => total + reward.stampsRequiredSnapshot,
    0
  )
  const primaryCity = await findPrimaryCity(Number(loyaltyAccount.id))
  const [venues, venueCount] = await Promise.all([
    primaryCity
      ? Venue.query()
          .where('company_id', companyId)
          .where('city', primaryCity)
          .orderBy('name', 'asc')
      : [],
    Venue.query().where('company_id', companyId).count('* as total').first(),
  ])

  return {
    loyaltyAccount: {
      id: Number(loyaltyAccount.id),
      company: {
        id: companyId,
        name: company.name,
      },
      program: {
        id: Number(loyaltyProgram.id),
        name: loyaltyProgram.name,
        rewardTitle: loyaltyProgram.rewardTitle,
        stampsRequired: loyaltyProgram.stampsRequired,
        stampCount: Math.max(totalStampCount - allocatedStampCount, 0),
      },
      primaryCity,
      venueCount: Number(venueCount?.$extras.total ?? 0),
      venues: venues.map((venue) => ({
        id: Number(venue.id),
        name: venue.name,
        category: venue.category,
        addressLine1: venue.addressLine1,
        addressLine2: venue.addressLine2,
        postalCode: venue.postalCode,
        city: venue.city,
        countryCode: venue.countryCode,
      })),
      availableRewards: loyaltyAccount.earnedRewards
        .filter((reward) => reward.redeemedAt === null)
        .map((reward) => ({
          id: Number(reward.id),
          title: reward.rewardTitleSnapshot,
          earnedAt: reward.earnedAt.toUTC().toISO()!,
        })),
      recentStamps: loyaltyAccount.stamps.map((stamp) => ({
        id: Number(stamp.id),
        createdAt: stamp.createdAt.toUTC().toISO()!,
        venue: {
          id: Number(stamp.nfcTag.venue.id),
          name: stamp.nfcTag.venue.name,
        },
      })),
    },
  }
}

async function findPrimaryCity(loyaltyAccountId: number): Promise<string | null> {
  const city = await Stamp.query()
    .where('stamps.loyalty_account_id', loyaltyAccountId)
    .join('nfc_tags', 'nfc_tags.id', 'stamps.nfc_tag_id')
    .join('venues', 'venues.id', 'nfc_tags.venue_id')
    .whereNotNull('venues.city')
    .select('venues.city')
    .count('* as stamp_count')
    .max('stamps.created_at as latest_stamp_at')
    .groupBy('venues.city')
    .orderBy('stamp_count', 'desc')
    .orderBy('latest_stamp_at', 'desc')
    .orderBy('venues.city', 'asc')
    .first()

  return (city?.$extras.city as string | undefined) ?? null
}
