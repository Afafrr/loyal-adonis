import { membershipRoles } from '#authorization/roles'
import Company from '#models/company'
import LoyaltyProgram from '#models/loyalty_program'
import Membership from '#models/membership'
import Venue from '#models/venue'

export async function getOwnerDashboard(userId: number) {
  const membership = await Membership.query()
    .where('user_id', userId)
    .where('role', membershipRoles.companyOwner)
    .first()

  if (!membership?.companyId) {
    return null
  }

  const companyId = Number(membership.companyId)
  const [company, program, venues] = await Promise.all([
    Company.findOrFail(companyId),
    LoyaltyProgram.query().where('company_id', companyId).first(),
    Venue.query().where('company_id', companyId).orderBy('name', 'asc'),
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
    venues: venues.map((venue) => ({
      id: Number(venue.id),
      name: venue.name,
      category: venue.category,
      city: venue.city,
      addressLine1: venue.addressLine1,
    })),
  }
}
