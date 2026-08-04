import LoyaltyAccount from '#models/loyalty_account'
import db from '@adonisjs/lucid/services/db'

type LocationSummary = {
  id: number
  name: string
  lastVisitedAt: string
  stampCount: number
}

type LocationAggregateRow = {
  last_visited_at: Date | string
  loyalty_account_id: number | string
  name: string
  stamp_count: number | string
  venue_id: number | string
}

const recentLocationAccountLimit = 3
const recentLocationLimit = 2

export async function listLoyaltyAccounts(userId: number) {
  const loyaltyAccounts = await LoyaltyAccount.query()
    .where('user_id', userId)
    .orderBy('created_at', 'asc')
    .withCount('stamps')
    .preload('loyaltyProgram', (loyaltyProgramQuery) => loyaltyProgramQuery.preload('company'))

  const locationsByAccount = await loadLocationSummaries(
    loyaltyAccounts.slice(0, recentLocationAccountLimit).map((loyaltyAccount) => Number(loyaltyAccount.id))
  )

  return {
    loyaltyAccounts: loyaltyAccounts.map((loyaltyAccount) =>
      toAccountSummary(loyaltyAccount, locationsByAccount.get(Number(loyaltyAccount.id)) ?? [])
    ),
  }
}

async function loadLocationSummaries(accountIds: number[]) {
  const locationsByAccount = new Map<number, LocationSummary[]>()

  if (accountIds.length === 0) {
    return locationsByAccount
  }

  const locationAggregates = db
    .from('stamps')
    .innerJoin('nfc_tags', 'nfc_tags.id', 'stamps.nfc_tag_id')
    .innerJoin('venues', 'venues.id', 'nfc_tags.venue_id')
    .whereIn('stamps.loyalty_account_id', accountIds)
    .groupBy('stamps.loyalty_account_id', 'venues.id', 'venues.name')
    .select('stamps.loyalty_account_id', 'venues.id as venue_id', 'venues.name')
    .count('* as stamp_count')
    .max('stamps.created_at as last_visited_at')

  const rankedLocations = db
    .from(locationAggregates.as('location_aggregates'))
    .select('*')
    .select(
      db.raw(`
        ROW_NUMBER() OVER (
          PARTITION BY loyalty_account_id
          ORDER BY last_visited_at DESC, stamp_count DESC, venue_id ASC
        ) AS location_rank
      `)
    )

  const rows = (await db
    .from(rankedLocations.as('ranked_locations'))
    .where('location_rank', '<=', recentLocationLimit)
    .orderBy('loyalty_account_id', 'asc')
    .orderBy('location_rank', 'asc')
    .select(
      'loyalty_account_id',
      'venue_id',
      'name',
      'stamp_count',
      'last_visited_at'
    )) as LocationAggregateRow[]

  for (const row of rows) {
    const accountId = Number(row.loyalty_account_id)
    const locations = locationsByAccount.get(accountId) ?? []

    locations.push({
      id: Number(row.venue_id),
      name: row.name,
      lastVisitedAt: toIsoString(row.last_visited_at),
      stampCount: Number(row.stamp_count),
    })
    locationsByAccount.set(accountId, locations)
  }

  return locationsByAccount
}

function toAccountSummary(loyaltyAccount: LoyaltyAccount, locations: LocationSummary[]) {
  const { loyaltyProgram } = loyaltyAccount
  const { company } = loyaltyProgram

  return {
    id: Number(loyaltyAccount.id),
    program: {
      id: Number(loyaltyProgram.id),
      name: loyaltyProgram.name,
      rewardTitle: loyaltyProgram.rewardTitle,
      stampsRequired: loyaltyProgram.stampsRequired,
      stampCount: Number(loyaltyAccount.$extras.stamps_count),
    },
    company: {
      id: Number(company.id),
      name: company.name,
    },
    locations,
  }
}

function toIsoString(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Database returned an invalid stamp timestamp')
  }

  return date.toISOString()
}
