import type User from '#models/user'
import type Venue from '#models/venue'
import MembershipAccessService, {
  type AuthorizationScope,
} from '#services/access/membership_access_service'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'

/**
 * Customer NFC scans are intentionally not a staff permission. They remain protected by
 * authentication, cryptographic tag verification, and the scan service.
 */
@inject()
export default class VenuePolicy extends BasePolicy {
  constructor(private access: MembershipAccessService) {
    super()
  }

  viewDashboard(user: User, venue: Venue): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'venue.dashboard.view', this.scopeFor(venue))
  }

  update(user: User, venue: Venue): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'venue.update', this.scopeFor(venue))
  }

  manageNfcTags(user: User, venue: Venue): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'nfcTag.manage', this.scopeFor(venue))
  }

  redeemReward(user: User, venue: Venue): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'redemption.create', this.scopeFor(venue))
  }

  delete(user: User, venue: Venue): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'venue.delete', this.scopeFor(venue))
  }

  private scopeFor(venue: Venue): AuthorizationScope {
    return {
      type: 'venue',
      companyId: venue.companyId,
      venueId: venue.id,
    }
  }
}
