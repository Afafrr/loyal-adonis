export const permissions = [
  // Access to platform-wide administration that is not scoped to one company or venue.
  'platform.access',

  // Company management. Creating and deleting companies are intentionally admin-only.
  'company.create',
  'company.view',
  'company.update',
  'company.delete',

  // Venue dashboard access is separate from editing venue settings.
  'venue.create',
  'venue.dashboard.view',
  'venue.update',
  'venue.delete',

  // Registering, activating, deactivating, and replacing NFC tags assigned to a venue.
  'nfcTag.manage',

  // Inactive programs are hidden from customers but may be viewed by business administrators.
  'loyaltyProgram.create',
  'loyaltyProgram.viewInactive',
  'loyaltyProgram.update',
  'loyaltyProgram.deactivate',
  'loyaltyProgram.delete',

  // Membership permissions control role assignment; roleGrants separately limits target roles.
  'membership.assign',
  'membership.changeRole',
  'membership.revoke',

  // Confirming that an earned reward has been redeemed at a specific venue.
  'redemption.create',
] as const

export type Permission = (typeof permissions)[number]
