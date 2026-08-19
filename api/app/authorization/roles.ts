import { permissions, type Permission } from '#authorization/permissions'

/**
 * The keys must match the role values stored in the memberships table.
 * Permissions describe what a role may do. Membership scope describes where.
 */
export const rolePermissions = {
  admin: permissions,

  company_owner: [
    'company.view',
    'company.update',
    'venue.create',
    'venue.dashboard.view',
    'venue.update',
    'venue.delete',
    'nfcTag.manage',
    'loyaltyProgram.create',
    'loyaltyProgram.viewInactive',
    'loyaltyProgram.update',
    'loyaltyProgram.deactivate',
    'membership.assign',
    'membership.changeRole',
    'membership.revoke',
    'redemption.create',
  ],

  venue_manager: [
    'venue.dashboard.view',
    'venue.update',
    'nfcTag.manage',
    'membership.assign',
    'membership.changeRole',
    'membership.revoke',
    'redemption.create',
  ],

  venue_staff: ['venue.dashboard.view', 'redemption.create'],
} as const satisfies Record<string, readonly Permission[]>

export type MembershipRole = keyof typeof rolePermissions
export type VenueMembershipRole = Extract<MembershipRole, 'venue_manager' | 'venue_staff'>
export type MembershipScope = 'platform' | 'company' | 'venue'

/** Defines where a membership role applies. */
export const roleScopes = {
  admin: 'platform',
  company_owner: 'company',
  venue_manager: 'venue',
  venue_staff: 'venue',
} as const satisfies Record<MembershipRole, MembershipScope>

/** Defines which roles an actor role may assign, change, or revoke. */
export const roleGrants = {
  admin: ['admin', 'company_owner', 'venue_manager', 'venue_staff'],
  company_owner: ['venue_manager', 'venue_staff'],
  venue_manager: ['venue_staff'],
  venue_staff: [],
} as const satisfies Record<MembershipRole, readonly MembershipRole[]>

export function isVenueMembershipRole(role: MembershipRole): role is VenueMembershipRole {
  return role === 'venue_manager' || role === 'venue_staff'
}
