import Company from '#models/company'
import Membership from '#models/membership'
import Venue from '#models/venue'
import VenuePolicy from '#policies/venue_policy'
import { bouncerFor, createUser } from '#tests/helpers/authorization'
import { test } from '@japa/runner'

test.group('VenuePolicy', () => {
  test('an admin may manage every venue', async ({ assert }) => {
    const admin = await createUser('venue-policy-admin@example.com')
    const company = await Company.create({ name: 'Admin Venue Coffee' })
    const venue = await Venue.create({ companyId: company.id, name: 'Admin Venue' })

    await Membership.create({ userId: admin.id, role: 'admin' })

    assert.isTrue(await bouncerFor(admin).with(VenuePolicy).allows('viewDashboard', venue))
    assert.isTrue(await bouncerFor(admin).with(VenuePolicy).allows('update', venue))
    assert.isTrue(await bouncerFor(admin).with(VenuePolicy).allows('manageNfcTags', venue))
    assert.isTrue(await bouncerFor(admin).with(VenuePolicy).allows('redeemReward', venue))
    assert.isTrue(await bouncerFor(admin).with(VenuePolicy).allows('delete', venue))
  })

  test('a company owner may manage venues only in their company', async ({ assert }) => {
    const owner = await createUser('venue-policy-owner@example.com')
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Owner Venue Coffee' }),
      Company.create({ name: 'Other Owner Venue Coffee' }),
    ])
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Owned Venue' }),
      Venue.create({ companyId: otherCompany.id, name: 'Other Venue' }),
    ])

    await Membership.create({
      userId: owner.id,
      companyId: company.id,
      role: 'company_owner',
    })

    assert.isTrue(await bouncerFor(owner).with(VenuePolicy).allows('viewDashboard', venue))
    assert.isTrue(await bouncerFor(owner).with(VenuePolicy).allows('update', venue))
    assert.isTrue(await bouncerFor(owner).with(VenuePolicy).allows('manageNfcTags', venue))
    assert.isTrue(await bouncerFor(owner).with(VenuePolicy).allows('redeemReward', venue))
    assert.isTrue(await bouncerFor(owner).with(VenuePolicy).allows('delete', venue))

    assert.isFalse(await bouncerFor(owner).with(VenuePolicy).allows('viewDashboard', otherVenue))
    assert.isFalse(await bouncerFor(owner).with(VenuePolicy).allows('update', otherVenue))
    assert.isFalse(await bouncerFor(owner).with(VenuePolicy).allows('manageNfcTags', otherVenue))
    assert.isFalse(await bouncerFor(owner).with(VenuePolicy).allows('redeemReward', otherVenue))
    assert.isFalse(await bouncerFor(owner).with(VenuePolicy).allows('delete', otherVenue))
  })

  test('a manager may manage and perform operations only in their venue', async ({ assert }) => {
    const manager = await createUser('venue-policy-manager@example.com')
    const company = await Company.create({ name: 'Manager Venue Coffee' })
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Managed Venue' }),
      Venue.create({ companyId: company.id, name: 'Unmanaged Venue' }),
    ])

    await Membership.create({
      userId: manager.id,
      venueId: venue.id,
      role: 'venue_manager',
    })

    assert.isTrue(await bouncerFor(manager).with(VenuePolicy).allows('viewDashboard', venue))
    assert.isTrue(await bouncerFor(manager).with(VenuePolicy).allows('update', venue))
    assert.isTrue(await bouncerFor(manager).with(VenuePolicy).allows('manageNfcTags', venue))
    assert.isTrue(await bouncerFor(manager).with(VenuePolicy).allows('redeemReward', venue))
    assert.isFalse(await bouncerFor(manager).with(VenuePolicy).allows('delete', venue))

    assert.isFalse(await bouncerFor(manager).with(VenuePolicy).allows('viewDashboard', otherVenue))
    assert.isFalse(await bouncerFor(manager).with(VenuePolicy).allows('update', otherVenue))
    assert.isFalse(await bouncerFor(manager).with(VenuePolicy).allows('manageNfcTags', otherVenue))
    assert.isFalse(await bouncerFor(manager).with(VenuePolicy).allows('redeemReward', otherVenue))
    assert.isFalse(await bouncerFor(manager).with(VenuePolicy).allows('delete', otherVenue))
  })

  test('staff may view the dashboard and redeem rewards only in their venue', async ({
    assert,
  }) => {
    const staff = await createUser('venue-policy-staff@example.com')
    const company = await Company.create({ name: 'Staff Venue Coffee' })
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Staff Venue' }),
      Venue.create({ companyId: company.id, name: 'Other Staff Venue' }),
    ])

    await Membership.create({ userId: staff.id, venueId: venue.id, role: 'venue_staff' })

    assert.isTrue(await bouncerFor(staff).with(VenuePolicy).allows('viewDashboard', venue))
    assert.isTrue(await bouncerFor(staff).with(VenuePolicy).allows('redeemReward', venue))
    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('update', venue))
    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('manageNfcTags', venue))
    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('delete', venue))

    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('viewDashboard', otherVenue))
    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('redeemReward', otherVenue))
    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('manageNfcTags', otherVenue))
    assert.isFalse(await bouncerFor(staff).with(VenuePolicy).allows('delete', otherVenue))
  })

  test('permissions and scopes from separate memberships cannot be combined', async ({
    assert,
  }) => {
    const user = await createUser('venue-policy-no-cross-membership-escalation@example.com')
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Permission Source Coffee' }),
      Company.create({ name: 'Scope Source Coffee' }),
    ])
    const otherVenue = await Venue.create({
      companyId: otherCompany.id,
      name: 'Scope Source Venue',
    })

    await Membership.createMany([
      { userId: user.id, companyId: company.id, role: 'company_owner' },
      { userId: user.id, venueId: otherVenue.id, role: 'venue_staff' },
    ])

    assert.isFalse(await bouncerFor(user).with(VenuePolicy).allows('update', otherVenue))
    assert.isFalse(await bouncerFor(user).with(VenuePolicy).allows('manageNfcTags', otherVenue))
  })
})
