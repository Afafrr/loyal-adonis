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

export type DashboardAccess = {
  scope: 'platform' | 'company' | 'venue'
  memberships: Membership[]
  hasPlatformAccess: boolean
  ownedCompanyIds: number[]
  directlyAssignedVenueIds: number[]
  companyIds: number[]
  venueIds: number[]
}

function uniqueIds(ids: number[]) {
  return [...new Set(ids)]
}

function getOwnedCompanyIds(memberships: Membership[]) {
  return uniqueIds(
    memberships.flatMap((membership) =>
      roleScopes[membership.role] === 'company' && membership.companyId !== null
        ? [Number(membership.companyId)]
        : []
    )
  )
}

function getAssignedVenueIds(memberships: Membership[]) {
  return uniqueIds(
    memberships.flatMap((membership) =>
      roleScopes[membership.role] === 'venue' && membership.venueId !== null
        ? [Number(membership.venueId)]
        : []
    )
  )
}

async function getAccessibleVenues(
  hasPlatformAccess: boolean,
  ownedCompanyIds: number[],
  assignedVenueIds: number[]
) {
  const query = Venue.query().select('id', 'company_id')

  if (hasPlatformAccess) {
    return query
  }

  if (ownedCompanyIds.length > 0 && assignedVenueIds.length > 0) {
    query.where((scopeQuery) => {
      scopeQuery.whereIn('company_id', ownedCompanyIds).orWhereIn('id', assignedVenueIds)
    })
  } else if (ownedCompanyIds.length > 0) {
    query.whereIn('company_id', ownedCompanyIds)
  } else {
    query.whereIn('id', assignedVenueIds)
  }

  return query
}

async function getPlatformCompanyIds(hasPlatformAccess: boolean) {
  if (!hasPlatformAccess) {
    return []
  }

  const companies = await Company.query().select('id')
  return companies.map((company) => Number(company.id))
}

export async function getDashboardAccess(userId: number): Promise<DashboardAccess | null> {
  const userMemberships = await Membership.query().where('user_id', userId).orderBy('id', 'asc')
  const memberships = userMemberships.filter((membership) =>
    roleHasPermission(membership.role, 'venue.dashboard.view')
  )

  if (memberships.length === 0) {
    return null
  }

  const hasPlatformAccess = memberships.some(
    (membership) => roleScopes[membership.role] === 'platform'
  )
  const ownedCompanyIds = getOwnedCompanyIds(memberships)
  const directlyAssignedVenueIds = getAssignedVenueIds(memberships)

  const [venues, platformCompanyIds] = await Promise.all([
    getAccessibleVenues(hasPlatformAccess, ownedCompanyIds, directlyAssignedVenueIds),
    getPlatformCompanyIds(hasPlatformAccess),
  ])
  const companyIds = uniqueIds([
    ...ownedCompanyIds,
    ...platformCompanyIds,
    ...venues.map((venue) => Number(venue.companyId)),
  ])

  return {
    scope: hasPlatformAccess ? 'platform' : ownedCompanyIds.length > 0 ? 'company' : 'venue',
    memberships,
    hasPlatformAccess,
    ownedCompanyIds,
    directlyAssignedVenueIds,
    companyIds,
    venueIds: venues.map((venue) => Number(venue.id)),
  }
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
