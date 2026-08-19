import type { Permission } from '#authorization/permissions'
import { roleGrants, rolePermissions, roleScopes, type MembershipRole } from '#authorization/roles'
import Membership from '#models/membership'
import type User from '#models/user'

type ResourceId = number | bigint

export type AuthorizationScope =
  | { type: 'platform' }
  | { type: 'company'; companyId: ResourceId }
  | { type: 'venue'; companyId: ResourceId; venueId: ResourceId }

export default class MembershipAccessService {
  async allows(user: User, permission: Permission, scope: AuthorizationScope) {
    const memberships = await this.forUser(user)

    return memberships.some(
      (membership) =>
        this.roleHasPermission(membership.role, permission) &&
        this.membershipMatchesScope(membership, scope)
    )
  }

  async canManageRoles(
    user: User,
    permission: Extract<
      Permission,
      'membership.assign' | 'membership.changeRole' | 'membership.revoke'
    >,
    targetRoles: readonly MembershipRole[],
    scope: AuthorizationScope
  ) {
    const memberships = await this.forUser(user) //user could have multiple memberships

    return memberships.some(
      (membership) =>
        this.roleHasPermission(membership.role, permission) &&
        this.membershipMatchesScope(membership, scope) &&
        targetRoles.every((targetRole) => this.roleCanGrant(membership.role, targetRole))
    )
  }

  private forUser(user: User) {
    return Membership.query().where('user_id', String(user.id))
  }

  private roleHasPermission(role: MembershipRole, permission: Permission) {
    return (rolePermissions[role] as readonly Permission[]).includes(permission)
  }

  private roleCanGrant(actorRole: MembershipRole, targetRole: MembershipRole) {
    return (roleGrants[actorRole] as readonly MembershipRole[]).includes(targetRole)
  }

  private membershipMatchesScope(membership: Membership, scope: AuthorizationScope) {
    switch (roleScopes[membership.role]) {
      case 'platform':
        return true
      case 'company':
        return (
          scope.type !== 'platform' &&
          membership.companyId !== null &&
          String(membership.companyId) === String(scope.companyId)
        )
      case 'venue':
        return (
          scope.type === 'venue' &&
          membership.venueId !== null &&
          String(membership.venueId) === String(scope.venueId)
        )
    }
  }
}
