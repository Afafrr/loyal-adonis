import type Company from '#models/company'
import type LoyaltyProgram from '#models/loyalty_program'
import type User from '#models/user'
import MembershipAccessService from '#services/access/membership_access_service'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'

@inject()
export default class LoyaltyProgramPolicy extends BasePolicy {
  constructor(private access: MembershipAccessService) {
    super()
  }

  create(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'loyaltyProgram.create', {
      type: 'company',
      companyId: company.id,
    })
  }

  async view(user: User, loyaltyProgram: LoyaltyProgram): Promise<AuthorizerResponse> {
    if (loyaltyProgram.active) {
      return true
    }

    return this.access.allows(user, 'loyaltyProgram.viewInactive', {
      type: 'company',
      companyId: loyaltyProgram.companyId,
    })
  }

  update(user: User, loyaltyProgram: LoyaltyProgram): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'loyaltyProgram.update', {
      type: 'company',
      companyId: loyaltyProgram.companyId,
    })
  }

  deactivate(user: User, loyaltyProgram: LoyaltyProgram): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'loyaltyProgram.deactivate', {
      type: 'company',
      companyId: loyaltyProgram.companyId,
    })
  }

  delete(user: User, loyaltyProgram: LoyaltyProgram): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'loyaltyProgram.delete', {
      type: 'company',
      companyId: loyaltyProgram.companyId,
    })
  }
}
