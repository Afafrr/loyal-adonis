import type { Permission } from '#authorization/permissions'
import {
  roleHasPermission,
  rolePermissions,
  roleScopes,
  type MembershipRole,
} from '#authorization/roles'
import Company from '#models/company'
import Membership from '#models/membership'
import Venue from '#models/venue'

export type DashboardGrant = {
  role: MembershipRole
  permissions: readonly Permission[]
}

export type DashboardFilters = {
  companyId?: number
  venueId?: number
}

export type DashboardAccess = {
  // No data scope until exactly one company or venue has been resolved.
  dataScope: 'company' | 'venue' | null
  memberships: Membership[]
  companyIds: number[]
  venueIds: number[]
}

type MembershipAccess = {
  memberships: Membership[]
  hasPlatformAccess: boolean
  ownedCompanyIds: number[]
  assignedVenueIds: number[]
}

function uniqueIds(ids: number[]) {
  return [...new Set(ids)]
}

export async function getDashboardAccess(
  userId: number,
  filters: DashboardFilters = {}
): Promise<DashboardAccess | null> {
  const userMemberships = await Membership.query().where('user_id', userId).orderBy('id', 'asc')
  const memberships = userMemberships.filter((membership) =>
    roleHasPermission(membership.role, 'venue.dashboard.view')
  )

  if (memberships.length === 0) {
    return null
  }

  const access = resolveMembershipAccess(memberships)

  //case if params look for certain venueId
  if (filters.venueId !== undefined) {
    const venue = await accessibleVenuesQuery(access).where('id', filters.venueId).first()
    if (!venue) {
      return null
    }

    const companyId = Number(venue.companyId)
    if (filters.companyId !== undefined && filters.companyId !== companyId) {
      return null
    }

    // An explicit venue always narrows data, including for platform and company roles.
    return {
      dataScope: 'venue',
      memberships,
      companyIds: [companyId],
      venueIds: [Number(venue.id)],
    }
  }

  //case if params look for certain companyId
  if (filters.companyId !== undefined) {
    return getCompanyDashboardAccess(access, filters.companyId)
  }

  return getDefaultDashboardAccess(access)
}

// Starts a venue query constrained to the user's authorized scope.
function accessibleVenuesQuery(access: MembershipAccess) {
  const query = Venue.query().select('id', 'company_id')

  if (!access.hasPlatformAccess) {
    if (access.ownedCompanyIds.length > 0 && access.assignedVenueIds.length > 0) {
      query.where((scopeQuery) => {
        scopeQuery
          .whereIn('company_id', access.ownedCompanyIds)
          .orWhereIn('id', access.assignedVenueIds)
      })
    } else if (access.ownedCompanyIds.length > 0) {
      query.whereIn('company_id', access.ownedCompanyIds)
    } else {
      query.whereIn('id', access.assignedVenueIds)
    }
  }

  return query
}

function resolveMembershipAccess(memberships: Membership[]): MembershipAccess {
  let hasPlatformAccess = false
  const ownedCompanyIds: number[] = []
  const assignedVenueIds: number[] = []

  for (const membership of memberships) {
    switch (roleScopes[membership.role]) {
      case 'platform':
        hasPlatformAccess = true
        break
      case 'company':
        if (membership.companyId !== null) {
          ownedCompanyIds.push(Number(membership.companyId))
        }
        break
      case 'venue':
        if (membership.venueId !== null) {
          assignedVenueIds.push(Number(membership.venueId))
        }
        break
    }
  }

  return {
    memberships,
    hasPlatformAccess,
    ownedCompanyIds: uniqueIds(ownedCompanyIds),
    assignedVenueIds: uniqueIds(assignedVenueIds),
  }
}

async function getCompanyDashboardAccess(
  access: MembershipAccess,
  companyId: number
): Promise<DashboardAccess | null> {
  const [company, venues] = await Promise.all([
    Company.query().select('id').where('id', companyId).first(),
    accessibleVenuesQuery(access).where('company_id', companyId),
  ])

  if (!company) {
    return null
  }

  const hasWideAccess = hasCompanyWideDashboardAccess(access, companyId)
  // Venue-only roles need access to at least one venue in the selected company.
  if (!hasWideAccess && venues.length === 0) {
    return null
  }

  return {
    dataScope: hasWideAccess ? 'company' : 'venue',
    memberships: access.memberships,
    companyIds: [companyId],
    venueIds: venues.map((venue) => Number(venue.id)),
  }
}

async function getDefaultDashboardAccess(access: MembershipAccess): Promise<DashboardAccess> {
  const [venues, platformCompanies] = await Promise.all([
    accessibleVenuesQuery(access),
    access.hasPlatformAccess ? Company.query().select('id') : Promise.resolve([]),
  ])

  // Include companies without venues for platform admins and company owners.
  const companyIds = uniqueIds([
    ...access.ownedCompanyIds,
    ...platformCompanies.map((company) => Number(company.id)),
    ...venues.map((venue) => Number(venue.companyId)),
  ])

  let dataScope: DashboardAccess['dataScope'] = null
  if (companyIds.length === 1) {
    dataScope = hasCompanyWideDashboardAccess(access, companyIds[0]) ? 'company' : 'venue'
  }

  return {
    dataScope,
    memberships: access.memberships,
    companyIds,
    venueIds: venues.map((venue) => Number(venue.id)),
  }
}

// Platform and matching company memberships grant access to all company data.
function hasCompanyWideDashboardAccess(access: MembershipAccess, companyId: number) {
  return access.memberships.some((membership) => membershipMatchesCompany(membership, companyId))
}

function membershipMatchesCompany(membership: Membership, companyId: number) {
  const scope = roleScopes[membership.role]

  return (
    scope === 'platform' ||
    (scope === 'company' &&
      membership.companyId !== null &&
      Number(membership.companyId) === companyId)
  )
}

function toGrant(membership: Membership): DashboardGrant {
  return {
    role: membership.role,
    permissions: rolePermissions[membership.role],
  }
}

export function grantsForCompany(access: DashboardAccess, companyId: number): DashboardGrant[] {
  return access.memberships
    .filter((membership) => membershipMatchesCompany(membership, companyId))
    .map(toGrant)
}

export function grantsForVenue(
  access: DashboardAccess,
  companyId: number,
  venueId: number
): DashboardGrant[] {
  return access.memberships
    .filter(
      (membership) =>
        membershipMatchesCompany(membership, companyId) ||
        (roleScopes[membership.role] === 'venue' &&
          membership.venueId !== null &&
          Number(membership.venueId) === venueId)
    )
    .map(toGrant)
}

export function getDashboardScope(access: DashboardAccess, companyId: number) {
  return access.dataScope === 'company'
    ? { type: 'company' as const, companyId }
    : { type: 'venue' as const, companyId, venueIds: access.venueIds }
}
