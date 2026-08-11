import LoyaltyAccount from '#models/loyalty_account'

export async function listLoyaltyAccounts(userId: number) {
  const loyaltyAccounts = await LoyaltyAccount.query()
    .where('user_id', userId)
    .orderBy('created_at', 'asc')
    .withCount('stamps')
    .preload('loyaltyProgram', (loyaltyProgramQuery) => loyaltyProgramQuery.preload('company'))
    .preload('earnedRewards', (earnedRewardQuery) =>
      earnedRewardQuery.select('id', 'loyalty_account_id', 'stamps_required_snapshot')
    )
    .preload('stamps', (stampQuery) =>
      stampQuery
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc')
        .groupLimit(1)
        .preload('nfcTag', (nfcTagQuery) => nfcTagQuery.preload('venue'))
    )

  return {
    loyaltyAccounts: loyaltyAccounts.map(toAccountSummary),
  }
}

function toAccountSummary(loyaltyAccount: LoyaltyAccount) {
  const { loyaltyProgram } = loyaltyAccount
  const { company } = loyaltyProgram
  const stampCount = Number(loyaltyAccount.$extras.stamps_count)
  const allocatedStampCount = loyaltyAccount.earnedRewards.reduce(
    (total, reward) => total + reward.stampsRequiredSnapshot,
    0
  )
  const latestStamp = loyaltyAccount.stamps[0]
  const lastVisitedVenue = latestStamp?.nfcTag.venue
  return {
    id: Number(loyaltyAccount.id),
    program: {
      id: Number(loyaltyProgram.id),
      name: loyaltyProgram.name,
      rewardTitle: loyaltyProgram.rewardTitle,
      stampsRequired: loyaltyProgram.stampsRequired,
      stampCount: Math.max(stampCount - allocatedStampCount, 0),
    },
    company: {
      id: Number(company.id),
      name: company.name,
    },
    lastVisitedVenue: lastVisitedVenue
      ? {
          id: Number(lastVisitedVenue.id),
          name: lastVisitedVenue.name,
          addressLine1: lastVisitedVenue.addressLine1,
          addressLine2: lastVisitedVenue.addressLine2,
          postalCode: lastVisitedVenue.postalCode,
          city: lastVisitedVenue.city,
          countryCode: lastVisitedVenue.countryCode,
        }
      : null,
  }
}
