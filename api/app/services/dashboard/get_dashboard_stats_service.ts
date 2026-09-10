import db from '@adonisjs/lucid/services/db'
import { getDashboardAccess } from '#services/dashboard/get_dashboard_access_service'

type CountRow = { count: number | string }
type StatResult = { value: number | null; error?: string }

function toStatResult(result: PromiseSettledResult<CountRow | undefined>): StatResult {
  if (result.status === 'rejected') {
    return { value: null, error: 'Unable to load this statistic.' }
  }

  return { value: Number(result.value?.count ?? 0) }
}

export async function getDashboardStats(userId: number) {
  const access = await getDashboardAccess(userId)
  if (!access) {
    return null
  }

  if (access.companyIds.length === 0) {
    return {
      view: 'empty' as const,
      stats: {
        customerCount: 0,
        stampCount: 0,
        earnedRewardCount: 0,
        activeTagCount: 0,
      },
      warnings: [],
    }
  }

  if (access.companyIds.length > 1) {
    return { companySelectionRequired: true as const }
  }

  const companyId = access.companyIds[0]
  const hasCompanyWideAccess =
    access.hasPlatformAccess || access.ownedCompanyIds.includes(companyId)

  const customerCountQuery = db
    .from('loyalty_accounts')
    .join('loyalty_programs', 'loyalty_programs.id', 'loyalty_accounts.loyalty_program_id')
    .countDistinct('loyalty_accounts.user_id as count')

  const earnedRewardCountQuery = db
    .from('earned_rewards')
    .join('loyalty_accounts', 'loyalty_accounts.id', 'earned_rewards.loyalty_account_id')
    .join('loyalty_programs', 'loyalty_programs.id', 'loyalty_accounts.loyalty_program_id')
    .countDistinct('earned_rewards.id as count')

  if (!access.hasPlatformAccess) {
    customerCountQuery.where((query) => {
      if (access.ownedCompanyIds.length > 0) {
        query.whereIn('loyalty_programs.company_id', access.ownedCompanyIds)
      }
      if (access.directlyAssignedVenueIds.length > 0) {
        const method = access.ownedCompanyIds.length > 0 ? 'orWhereExists' : 'whereExists'
        query[method]((stampQuery) => {
          stampQuery
            .select(db.raw('1'))
            .from('stamps')
            .join('nfc_tags', 'nfc_tags.id', 'stamps.nfc_tag_id')
            .whereColumn('stamps.loyalty_account_id', 'loyalty_accounts.id')
            .whereIn('nfc_tags.venue_id', access.directlyAssignedVenueIds)
        })
      }
    })

    earnedRewardCountQuery.where((query) => {
      if (access.ownedCompanyIds.length > 0) {
        query.whereIn('loyalty_programs.company_id', access.ownedCompanyIds)
      }
      if (access.directlyAssignedVenueIds.length > 0) {
        const method = access.ownedCompanyIds.length > 0 ? 'orWhereExists' : 'whereExists'
        query[method]((stampQuery) => {
          stampQuery
            .select(db.raw('1'))
            .from('stamps')
            .join('nfc_tags', 'nfc_tags.id', 'stamps.nfc_tag_id')
            .whereColumn('stamps.earned_reward_id', 'earned_rewards.id')
            .whereIn('nfc_tags.venue_id', access.directlyAssignedVenueIds)
        })
      }
    })
  }

  const results = await Promise.allSettled([
    customerCountQuery.first() as Promise<CountRow | undefined>,
    db
      .from('stamps')
      .join('nfc_tags', 'nfc_tags.id', 'stamps.nfc_tag_id')
      .whereIn('nfc_tags.venue_id', access.venueIds)
      .count('stamps.id as count')
      .first() as Promise<CountRow | undefined>,
    earnedRewardCountQuery.first() as Promise<CountRow | undefined>,
    db
      .from('nfc_tags')
      .whereIn('venue_id', access.venueIds)
      .where('active', true)
      .count('id as count')
      .first() as Promise<CountRow | undefined>,
  ])

  const [customerCount, stampCount, earnedRewardCount, activeTagCount] = results.map(toStatResult)
  const fields = ['customerCount', 'stampCount', 'earnedRewardCount', 'activeTagCount'] as const
  const warnings = results.flatMap((result, index) => {
    const stat = toStatResult(result)
    return stat.error ? [{ field: fields[index], message: stat.error }] : []
  })

  return {
    view: 'company' as const,
    scope: hasCompanyWideAccess
      ? { type: 'company' as const, companyId }
      : { type: 'venue' as const, companyId, venueIds: access.venueIds },
    stats: {
      customerCount: customerCount.value,
      stampCount: stampCount.value,
      earnedRewardCount: earnedRewardCount.value,
      activeTagCount: activeTagCount.value,
    },
    warnings,
  }
}
