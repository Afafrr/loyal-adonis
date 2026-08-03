import LoyaltyAccount from '#models/loyalty_account'

type LocationSummary = {
  id: number
  name: string
  firstScannedAt: string
  lastVisitedAt: string
  stampCount: number
}

export async function listLoyaltyAccounts(userId: number) {
  const loyaltyAccounts = await LoyaltyAccount.query()
    .where('user_id', userId)
    .preload('loyaltyProgram', (loyaltyProgramQuery) => loyaltyProgramQuery.preload('company'))
    .preload('stamps', (stampQuery) => {
      stampQuery
        .orderBy('created_at', 'asc')
        .preload('nfcTag', (nfcTagQuery) => nfcTagQuery.preload('venue'))
    })

  return {
    loyaltyAccounts: loyaltyAccounts.map(toAccountSummary).sort(byFirstVisit),
  }
}

function toAccountSummary(loyaltyAccount: LoyaltyAccount) {
  const { loyaltyProgram } = loyaltyAccount
  const { company } = loyaltyProgram
  const locations = summarizeLocations(loyaltyAccount)

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
    locations,
  }
}

function summarizeLocations(loyaltyAccount: LoyaltyAccount): LocationSummary[] {
  const locations = new Map<number, LocationSummary>()

  for (const stamp of loyaltyAccount.stamps) {
    const venue = stamp.nfcTag.venue
    const venueId = Number(venue.id)
    const location = locations.get(venueId)

    if (location) {
      location.stampCount += 1
      location.lastVisitedAt = stamp.createdAt.toISO()!
    } else {
      const scannedAt = stamp.createdAt.toISO()!

      locations.set(venueId, {
        id: venueId,
        name: venue.name,
        firstScannedAt: scannedAt,
        lastVisitedAt: scannedAt,
        stampCount: 1,
      })
    }
  }

  return [...locations.values()].sort(byLastVisit)
}

function byLastVisit(firstLocation: LocationSummary, secondLocation: LocationSummary) {
  return (
    secondLocation.lastVisitedAt.localeCompare(firstLocation.lastVisitedAt) ||
    secondLocation.stampCount - firstLocation.stampCount
  )
}

function byFirstVisit(
  firstAccount: ReturnType<typeof toAccountSummary>,
  secondAccount: ReturnType<typeof toAccountSummary>
) {
  const firstVisit = earliestVisit(firstAccount.locations)
  const secondVisit = earliestVisit(secondAccount.locations)
  return firstVisit.localeCompare(secondVisit)
}

function earliestVisit(locations: LocationSummary[]) {
  return locations.reduce(
    (earliest, location) =>
      earliest === '' || location.firstScannedAt < earliest ? location.firstScannedAt : earliest,
    ''
  )
}
