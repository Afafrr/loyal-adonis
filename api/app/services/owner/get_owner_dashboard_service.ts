import db from '@adonisjs/lucid/services/db'
import { membershipRoles } from '#authorization/roles'
import Company from '#models/company'
import LoyaltyProgram from '#models/loyalty_program'
import Membership from '#models/membership'
import Venue from '#models/venue'

type CountRow = { count: number | string }

function countValue(row: CountRow | undefined) {
  return Number(row?.count ?? 0)
}

export async function getOwnerDashboard(userId: number) {
  const membership = await Membership.query()
    .where('user_id', userId)
    .where('role', membershipRoles.companyOwner)
    .first()

  if (!membership?.companyId) {
    return null
  }

  const companyId = Number(membership.companyId)
  const [company, program, venues, customerCount, stampCount, rewardCount, activeTagCount] =
    await Promise.all([
      Company.findOrFail(companyId),
      LoyaltyProgram.query().where('company_id', companyId).first(),
      Venue.query().where('company_id', companyId).orderBy('name', 'asc'),
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

  return {
    company: {
      id: companyId,
      name: company.name,
    },
    program: program
      ? {
          id: Number(program.id),
          name: program.name,
          rewardTitle: program.rewardTitle,
          stampsRequired: program.stampsRequired,
          active: program.active,
        }
      : null,
    stats: {
      venueCount: venues.length,
      customerCount: countValue(customerCount),
      stampCount: countValue(stampCount),
      earnedRewardCount: countValue(rewardCount),
      activeTagCount: countValue(activeTagCount),
    },
    venues: venues.map((venue) => ({
      id: Number(venue.id),
      name: venue.name,
      category: venue.category,
      city: venue.city,
      addressLine1: venue.addressLine1,
    })),
  }
}
