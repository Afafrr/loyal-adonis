import type Company from '#models/company'
import type User from '#models/user'
import MembershipAccessService from '#services/access/membership_access_service'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'

@inject()
export default class CompanyPolicy extends BasePolicy {
  constructor(private access: MembershipAccessService) {
    super()
  }

  create(user: User): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'company.create', { type: 'platform' })
  }

  view(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'company.view', {
      type: 'company',
      companyId: company.id,
    })
  }

  update(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'company.update', {
      type: 'company',
      companyId: company.id,
    })
  }

  createVenue(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'venue.create', {
      type: 'company',
      companyId: company.id,
    })
  }

  manageLoyaltyProgram(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'loyaltyProgram.update', {
      type: 'company',
      companyId: company.id,
    })
  }

  delete(user: User, company: Company): Promise<AuthorizerResponse> {
    return this.access.allows(user, 'company.delete', {
      type: 'company',
      companyId: company.id,
    })
  }
}
