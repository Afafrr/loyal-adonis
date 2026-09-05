import { rolePermissions } from '#authorization/roles'
import Membership from '#models/membership'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const memberships = await Membership.query().where('user_id', Number(user.id))

    return {
      id: Number(user.id),
      email: user.email,
      firstName: user.firstName,
      memberships: memberships.map((membership) => ({
        role: membership.role,
        companyId: membership.companyId === null ? null : Number(membership.companyId),
        venueId: membership.venueId === null ? null : Number(membership.venueId),
        permissions: rolePermissions[membership.role],
      })),
    }
  }
}
