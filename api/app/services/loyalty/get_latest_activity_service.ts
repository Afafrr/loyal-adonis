import Stamp from '#models/stamp'

export async function getLatestActivity(userId: number) {
  const latestStamp = await Stamp.query()
    .whereHas('loyaltyAccount', (loyaltyAccountQuery) =>
      loyaltyAccountQuery.where('user_id', userId)
    )
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc')
    .preload('loyaltyAccount', (loyaltyAccountQuery) =>
      loyaltyAccountQuery.preload('loyaltyProgram', (loyaltyProgramQuery) =>
        loyaltyProgramQuery.preload('company')
      )
    )
    .preload('nfcTag', (nfcTagQuery) => nfcTagQuery.preload('venue'))
    .first()

  if (!latestStamp) {
    return { latestActivity: null }
  }

  const { loyaltyProgram } = latestStamp.loyaltyAccount
  const { company } = loyaltyProgram
  const { venue } = latestStamp.nfcTag

  return {
    latestActivity: {
      loyaltyAccountId: Number(latestStamp.loyaltyAccountId),
      visitedAt: latestStamp.createdAt.toUTC().toISO()!,
      company: {
        id: Number(company.id),
        name: company.name,
      },
      venue: {
        id: Number(venue.id),
        name: venue.name,
      },
    },
  }
}
