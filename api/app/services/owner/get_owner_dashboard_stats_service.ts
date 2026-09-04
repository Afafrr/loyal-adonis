import db from '@adonisjs/lucid/services/db'
import { membershipRoles } from '#authorization/roles'
import Membership from '#models/membership'

type CountRow = { count: number | string }
type StatResult = { value: number | null; error?: string }

function toStatResult(result: PromiseSettledResult<CountRow | undefined>): StatResult {
  if (result.status === 'rejected') {
    return { value: null, error: 'Unable to load this statistic.' }
  }

  return { value: Number(result.value?.count ?? 0) }
}

export async function getOwnerDashboardStats(userId: number) {
  const membership = await Membership.query()
    .where('user_id', userId)
    .where('role', membershipRoles.companyOwner)
    .first()

  if (!membership?.companyId) {
    return null
  }

  const companyId = Number(membership.companyId)
  const results = await Promise.allSettled([
    db
      .from('loyalty_accounts')
      .join('loyalty_programs', 'loyalty_programs.id', 'loyalty_accounts.loyalty_program_id')
      .where('loyalty_programs.company_id', companyId)
      .countDistinct('loyalty_accounts.user_id as count')
      .first() as Promise<CountRow | undefined>,
    db
      .from('stamps')
      .join('loyalty_accounts', 'loyalty_accounts.id', 'stamps.loyalty_account_id')
      .join('loyalty_programs', 'loyalty_programs.id', 'loyalty_accounts.loyalty_program_id')
      .where('loyalty_programs.company_id', companyId)
      .count('stamps.id as count')
      .first() as Promise<CountRow | undefined>,
    db
      .from('earned_rewards')
      .join('loyalty_accounts', 'loyalty_accounts.id', 'earned_rewards.loyalty_account_id')
      .join('loyalty_programs', 'loyalty_programs.id', 'loyalty_accounts.loyalty_program_id')
      .where('loyalty_programs.company_id', companyId)
      .count('earned_rewards.id as count')
      .first() as Promise<CountRow | undefined>,
    db
      .from('nfc_tags')
      .join('venues', 'venues.id', 'nfc_tags.venue_id')
      .where('venues.company_id', companyId)
      .where('nfc_tags.active', true)
      .count('nfc_tags.id as count')
      .first() as Promise<CountRow | undefined>,
  ])

  const [customerCount, stampCount, earnedRewardCount, activeTagCount] = results.map(toStatResult)
  const warnings = results.flatMap((result, index) => {
    const stat = toStatResult(result)
    return stat.error
      ? [
          {
            field: ['customerCount', 'stampCount', 'earnedRewardCount', 'activeTagCount'][index],
            message: stat.error,
          },
        ]
      : []
  })

  return {
    stats: {
      customerCount: customerCount.value,
      stampCount: stampCount.value,
      earnedRewardCount: earnedRewardCount.value,
      activeTagCount: activeTagCount.value,
    },
    warnings,
  }
}
