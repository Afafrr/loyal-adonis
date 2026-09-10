import Company from '#models/company'
import LoyaltyProgram from '#models/loyalty_program'
import Venue from '#models/venue'
import {
  type DashboardAccess,
  type DashboardGrant,
  getDashboardAccess,
  grantsForCompany,
  grantsForVenue,
} from '#services/dashboard/get_dashboard_access_service'

function getDashboardScope(access: DashboardAccess, companyId: number) {
  const hasCompanyWideAccess =
    access.hasPlatformAccess || access.ownedCompanyIds.includes(companyId)

  return hasCompanyWideAccess
    ? { type: 'company' as const, companyId }
    : { type: 'venue' as const, companyId, venueIds: access.venueIds }
}

function toDashboardVenue(venue: Venue, access: DashboardAccess, companyId: number) {
  const venueId = Number(venue.id)

  return {
    id: venueId,
    name: venue.name,
    category: venue.category,
    city: venue.city,
    addressLine1: venue.addressLine1,
    access: grantsForVenue(access, companyId, venueId),
  }
}

type DashboardVenue = ReturnType<typeof toDashboardVenue>

function toDashboardProgram(
  program: LoyaltyProgram | null,
  companyGrants: DashboardGrant[],
  venues: DashboardVenue[]
) {
  if (!program) {
    return null
  }

  const venueGrants = venues.flatMap((venue) => venue.access)
  const canViewInactiveProgram = [...companyGrants, ...venueGrants].some((grant) =>
    grant.permissions.includes('loyaltyProgram.viewInactive')
  )

  if (!program.active && !canViewInactiveProgram) {
    return null
  }

  return {
    id: Number(program.id),
    name: program.name,
    rewardTitle: program.rewardTitle,
    stampsRequired: program.stampsRequired,
    active: program.active,
  }
}

export async function getDashboard(userId: number) {
  const access = await getDashboardAccess(userId)
  if (!access) {
    return null
  }

  const companies = await Company.query().whereIn('id', access.companyIds).orderBy('name', 'asc')

  if (companies.length === 0) {
    return { view: 'empty' as const, companies: [] }
  }

  if (companies.length > 1) {
    return {
      view: 'company_selection' as const,
      companies: companies.map((company) => ({
        id: Number(company.id),
        name: company.name,
      })),
    }
  }
  
  const company = companies[0]
  const companyId = Number(company.id)
  const [program, venues] = await Promise.all([
    LoyaltyProgram.query().where('company_id', companyId).first(),
    Venue.query().whereIn('id', access.venueIds).orderBy('name', 'asc'),
  ])

  const companyGrants = grantsForCompany(access, companyId)
  const dashboardVenues = venues.map((venue) => toDashboardVenue(venue, access, companyId))

  return {
    view: 'company' as const,
    scope: getDashboardScope(access, companyId),
    company: {
      id: companyId,
      name: company.name,
      access: companyGrants,
    },
    program: toDashboardProgram(program, companyGrants, dashboardVenues),
    venues: dashboardVenues,
  }
}
