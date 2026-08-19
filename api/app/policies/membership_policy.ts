import { isVenueMembershipRole, type VenueMembershipRole } from '#authorization/roles'
import type Company from '#models/company'
import type Membership from '#models/membership'
import type User from '#models/user'
import type Venue from '#models/venue'
import MembershipAccessService, {
  type AuthorizationScope,
} from '#services/access/membership_access_service'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'

function belongsToCompany(membership: Membership, company: Company) {
  return (
    membership.role === 'company_owner' &&
    membership.companyId !== null &&
    String(membership.companyId) === String(company.id)
  )
}

function belongsToVenue(membership: Membership, venue: Venue) {
  return (
    isVenueMembershipRole(membership.role) &&
    membership.venueId !== null &&
    String(membership.venueId) === String(venue.id)
  )
}

@inject()
export default class MembershipPolicy extends BasePolicy {
  constructor(private access: MembershipAccessService) {
    super()
  }

  assignPlatformAdmin(user: User): Promise<AuthorizerResponse> {
    return this.access.canManageRoles(user, 'membership.assign', ['admin'], {
      type: 'platform',
    })
  }

  assignCompanyOwner(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.canManageRoles(user, 'membership.assign', ['company_owner'], {
      type: 'company',
      companyId: company.id,
    })
  }

  assignVenueRole(
    user: User,
    venue: Venue,
    role: VenueMembershipRole
  ): Promise<AuthorizerResponse> {
    return this.access.canManageRoles(user, 'membership.assign', [role], this.scopeFor(venue))
  }

  async changeVenueRole(
    user: User,
    membership: Membership,
    venue: Venue,
    nextRole: VenueMembershipRole
  ): Promise<AuthorizerResponse> {
    if (!belongsToVenue(membership, venue)) {
      return false
    }

    return this.access.canManageRoles(
      user,
      'membership.changeRole',
      [membership.role as VenueMembershipRole, nextRole],
      this.scopeFor(venue)
    )
  }

  async revokeVenueRole(
    user: User,
    membership: Membership,
    venue: Venue
  ): Promise<AuthorizerResponse> {
    if (!belongsToVenue(membership, venue)) {
      return false
    }

    return this.access.canManageRoles(
      user,
      'membership.revoke',
      [membership.role as VenueMembershipRole],
      this.scopeFor(venue)
    )
  }

  async revokeCompanyOwner(
    user: User,
    membership: Membership,
    company: Company
  ): Promise<AuthorizerResponse> {
    if (!belongsToCompany(membership, company)) {
      return false
    }

    return this.access.canManageRoles(user, 'membership.revoke', ['company_owner'], {
      type: 'company',
      companyId: company.id,
    })
  }

  async revokePlatformAdmin(user: User, membership: Membership): Promise<AuthorizerResponse> {
    if (membership.role !== 'admin') {
      return false
    }

    return this.access.canManageRoles(user, 'membership.revoke', ['admin'], {
      type: 'platform',
    })
  }

  private scopeFor(venue: Venue): AuthorizationScope {
    return {
      type: 'venue',
      companyId: venue.companyId,
      venueId: venue.id,
    }
  }
}
