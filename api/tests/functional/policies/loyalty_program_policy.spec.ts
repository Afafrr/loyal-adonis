import Company from '#models/company'
import LoyaltyProgram from '#models/loyalty_program'
import Membership from '#models/membership'
import Venue from '#models/venue'
import LoyaltyProgramPolicy from '#policies/loyalty_program_policy'
import { bouncerFor, createUser } from '#tests/helpers/authorization'
import { test } from '@japa/runner'

function createProgram(companyId: number | bigint, name: string, active = true) {
  return LoyaltyProgram.create({
    companyId,
    name,
    rewardTitle: 'Free coffee',
    stampsRequired: 10,
    active,
  })
}

test.group('LoyaltyProgramPolicy', () => {
  test('active programs are visible without a membership', async ({ assert }) => {
    const customer = await createUser('program-policy-customer@example.com')
    const company = await Company.create({ name: 'Public Program Coffee' })
    const program = await createProgram(company.id, 'Public coffee stamps')

    assert.isTrue(await bouncerFor(customer).with(LoyaltyProgramPolicy).allows('view', program))
  })

  test('inactive programs are visible only to an admin or their company owner', async ({
    assert,
  }) => {
    const [admin, owner, otherOwner, manager, customer] = await Promise.all([
      createUser('program-policy-admin@example.com'),
      createUser('program-policy-owner@example.com'),
      createUser('program-policy-other-owner@example.com'),
      createUser('program-policy-manager@example.com'),
      createUser('program-policy-inactive-customer@example.com'),
    ])
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Private Program Coffee' }),
      Company.create({ name: 'Other Private Program Coffee' }),
    ])
    const venue = await Venue.create({ companyId: company.id, name: 'Private Program Venue' })
    const program = await createProgram(company.id, 'Private coffee stamps', false)

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
      { userId: otherOwner.id, companyId: otherCompany.id, role: 'company_owner' },
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
    ])

    assert.isTrue(await bouncerFor(admin).with(LoyaltyProgramPolicy).allows('view', program))
    assert.isTrue(await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('view', program))
    assert.isFalse(await bouncerFor(otherOwner).with(LoyaltyProgramPolicy).allows('view', program))
    assert.isFalse(await bouncerFor(manager).with(LoyaltyProgramPolicy).allows('view', program))
    assert.isFalse(await bouncerFor(customer).with(LoyaltyProgramPolicy).allows('view', program))
  })

  test('an admin may fully configure programs in every company', async ({ assert }) => {
    const admin = await createUser('program-policy-config-admin@example.com')
    const company = await Company.create({ name: 'Admin Program Coffee' })
    const program = await createProgram(company.id, 'Admin coffee stamps')

    await Membership.create({ userId: admin.id, role: 'admin' })

    assert.isTrue(await bouncerFor(admin).with(LoyaltyProgramPolicy).allows('create', company))
    assert.isTrue(await bouncerFor(admin).with(LoyaltyProgramPolicy).allows('update', program))
    assert.isTrue(await bouncerFor(admin).with(LoyaltyProgramPolicy).allows('deactivate', program))
    assert.isTrue(await bouncerFor(admin).with(LoyaltyProgramPolicy).allows('delete', program))
  })

  test('an owner may configure programs only for their company but may not delete them', async ({
    assert,
  }) => {
    const [owner, manager] = await Promise.all([
      createUser('program-policy-config-owner@example.com'),
      createUser('program-policy-config-manager@example.com'),
    ])
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Owner Program Coffee' }),
      Company.create({ name: 'Other Owner Program Coffee' }),
    ])
    const venue = await Venue.create({ companyId: company.id, name: 'Owner Program Venue' })
    const [program, otherProgram] = await Promise.all([
      createProgram(company.id, 'Owner coffee stamps'),
      createProgram(otherCompany.id, 'Other owner coffee stamps'),
    ])

    await Membership.createMany([
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
    ])

    assert.isTrue(await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('create', company))
    assert.isTrue(await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('update', program))
    assert.isTrue(await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('deactivate', program))
    assert.isFalse(await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('delete', program))

    assert.isFalse(
      await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('create', otherCompany)
    )
    assert.isFalse(
      await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('update', otherProgram)
    )
    assert.isFalse(
      await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('deactivate', otherProgram)
    )
    assert.isFalse(
      await bouncerFor(owner).with(LoyaltyProgramPolicy).allows('delete', otherProgram)
    )
    assert.isFalse(await bouncerFor(manager).with(LoyaltyProgramPolicy).allows('create', company))
    assert.isFalse(await bouncerFor(manager).with(LoyaltyProgramPolicy).allows('update', program))
  })
})
