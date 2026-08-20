import Company from '#models/company'
import Membership from '#models/membership'
import Venue from '#models/venue'
import CompanyPolicy from '#policies/company_policy'
import { bouncerFor, createUser } from '#tests/helpers/authorization'
import { test } from '@japa/runner'

test.group('CompanyPolicy', () => {
  test('only a platform admin may create and delete companies', async ({ assert }) => {
    const [admin, owner, customer] = await Promise.all([
      createUser('company-policy-admin@example.com'),
      createUser('company-policy-owner@example.com'),
      createUser('company-policy-customer@example.com'),
    ])
    const company = await Company.create({ name: 'Company Policy Coffee' })

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
    ])

    assert.isTrue(await bouncerFor(admin).with(CompanyPolicy).allows('create'))
    assert.isFalse(await bouncerFor(owner).with(CompanyPolicy).allows('create'))
    assert.isFalse(await bouncerFor(customer).with(CompanyPolicy).allows('create'))

    assert.isTrue(await bouncerFor(admin).with(CompanyPolicy).allows('delete', company))
    assert.isFalse(await bouncerFor(owner).with(CompanyPolicy).allows('delete', company))
  })

  test('a platform admin may manage every company', async ({ assert }) => {
    const admin = await createUser('company-policy-every-company-admin@example.com')
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Admin Managed Coffee' }),
      Company.create({ name: 'Other Admin Managed Coffee' }),
    ])

    await Membership.create({ userId: admin.id, role: 'admin' })

    for (const target of [company, otherCompany]) {
      assert.isTrue(await bouncerFor(admin).with(CompanyPolicy).allows('view', target))
      assert.isTrue(await bouncerFor(admin).with(CompanyPolicy).allows('update', target))
      assert.isTrue(await bouncerFor(admin).with(CompanyPolicy).allows('createVenue', target))
      assert.isTrue(
        await bouncerFor(admin).with(CompanyPolicy).allows('manageLoyaltyProgram', target)
      )
    }
  })

  test('a company owner may manage only their company', async ({ assert }) => {
    const owner = await createUser('company-policy-scoped-owner@example.com')
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Owned Coffee' }),
      Company.create({ name: 'Other Coffee' }),
    ])

    await Membership.create({
      userId: owner.id,
      companyId: company.id,
      role: 'company_owner',
    })
    //own company should be accessible
    assert.isTrue(await bouncerFor(owner).with(CompanyPolicy).allows('view', company))
    assert.isTrue(await bouncerFor(owner).with(CompanyPolicy).allows('update', company))
    assert.isTrue(await bouncerFor(owner).with(CompanyPolicy).allows('createVenue', company))
    assert.isTrue(
      await bouncerFor(owner).with(CompanyPolicy).allows('manageLoyaltyProgram', company)
    )
    //other company should not be accessible
    assert.isFalse(await bouncerFor(owner).with(CompanyPolicy).allows('view', otherCompany))
    assert.isFalse(await bouncerFor(owner).with(CompanyPolicy).allows('update', otherCompany))
    assert.isFalse(await bouncerFor(owner).with(CompanyPolicy).allows('createVenue', otherCompany))
    assert.isFalse(
      await bouncerFor(owner).with(CompanyPolicy).allows('manageLoyaltyProgram', otherCompany)
    )
  })

  test('venue roles and customers cannot access company management', async ({ assert }) => {
    const [manager, staff, customer] = await Promise.all([
      createUser('company-policy-manager@example.com'),
      createUser('company-policy-staff@example.com'),
      createUser('company-policy-no-membership@example.com'),
    ])
    const company = await Company.create({ name: 'Company Access Coffee' })
    const venue = await Venue.create({ companyId: company.id, name: 'Company Access Venue' })

    await Membership.createMany([
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
      { userId: staff.id, venueId: venue.id, role: 'venue_staff' },
    ])

    assert.isFalse(await bouncerFor(manager).with(CompanyPolicy).allows('view', company))
    assert.isFalse(await bouncerFor(manager).with(CompanyPolicy).allows('update', company))
    assert.isFalse(await bouncerFor(staff).with(CompanyPolicy).allows('view', company))
    assert.isFalse(await bouncerFor(customer).with(CompanyPolicy).allows('view', company))
  })
})
