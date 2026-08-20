import Company from '#models/company'
import Membership from '#models/membership'
import Venue from '#models/venue'
import MembershipPolicy from '#policies/membership_policy'
import { bouncerFor, createUser } from '#tests/helpers/authorization'
import { test } from '@japa/runner'

test.group('MembershipPolicy', () => {
  test('only an admin may assign a platform admin', async ({ assert }) => {
    const [admin, owner] = await Promise.all([
      createUser('membership-policy-platform-admin@example.com'),
      createUser('membership-policy-platform-owner@example.com'),
    ])
    const company = await Company.create({ name: 'Platform Role Coffee' })

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
    ])

    assert.isTrue(await bouncerFor(admin).with(MembershipPolicy).allows('assignPlatformAdmin'))
    assert.isFalse(await bouncerFor(owner).with(MembershipPolicy).allows('assignPlatformAdmin'))
  })

  test('only an admin may assign a company owner', async ({ assert }) => {
    const [admin, owner, manager] = await Promise.all([
      createUser('membership-policy-company-admin@example.com'),
      createUser('membership-policy-company-owner@example.com'),
      createUser('membership-policy-company-manager@example.com'),
    ])
    const company = await Company.create({ name: 'Company Role Coffee' })
    const venue = await Venue.create({ companyId: company.id, name: 'Company Role Venue' })

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
    ])

    assert.isTrue(
      await bouncerFor(admin).with(MembershipPolicy).allows('assignCompanyOwner', company)
    )
    assert.isFalse(
      await bouncerFor(owner).with(MembershipPolicy).allows('assignCompanyOwner', company)
    )
    assert.isFalse(
      await bouncerFor(manager).with(MembershipPolicy).allows('assignCompanyOwner', company)
    )
  })

  test('a company owner may assign venue roles only within their company', async ({ assert }) => {
    const owner = await createUser('membership-policy-venue-owner@example.com')
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Venue Assignment Coffee' }),
      Company.create({ name: 'Other Venue Assignment Coffee' }),
    ])
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Venue Assignment' }),
      Venue.create({ companyId: otherCompany.id, name: 'Other Venue Assignment' }),
    ])

    await Membership.create({
      userId: owner.id,
      companyId: company.id,
      role: 'company_owner',
    })

    assert.isTrue(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('assignVenueRole', venue, 'venue_manager')
    )
    assert.isTrue(
      await bouncerFor(owner).with(MembershipPolicy).allows('assignVenueRole', venue, 'venue_staff')
    )
    assert.isFalse(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('assignVenueRole', otherVenue, 'venue_staff')
    )
  })

  test('a venue manager may assign only staff in their venue', async ({ assert }) => {
    const [manager, staff] = await Promise.all([
      createUser('membership-policy-venue-manager@example.com'),
      createUser('membership-policy-venue-staff@example.com'),
    ])
    const company = await Company.create({ name: 'Manager Assignment Coffee' })
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Manager Assignment Venue' }),
      Venue.create({ companyId: company.id, name: 'Other Manager Assignment Venue' }),
    ])

    await Membership.createMany([
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
      { userId: staff.id, venueId: venue.id, role: 'venue_staff' },
    ])

    assert.isTrue(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('assignVenueRole', venue, 'venue_staff')
    )
    assert.isFalse(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('assignVenueRole', venue, 'venue_manager')
    )
    assert.isFalse(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('assignVenueRole', otherVenue, 'venue_staff')
    )
    assert.isFalse(
      await bouncerFor(staff).with(MembershipPolicy).allows('assignVenueRole', venue, 'venue_staff')
    )
  })

  test('role-grant power and venue scope cannot be combined from separate memberships', async ({
    assert,
  }) => {
    const user = await createUser('membership-policy-no-cross-membership-escalation@example.com')
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Role Grant Source Coffee' }),
      Company.create({ name: 'Venue Scope Source Coffee' }),
    ])
    const otherVenue = await Venue.create({
      companyId: otherCompany.id,
      name: 'Venue Scope Source',
    })

    await Membership.createMany([
      { userId: user.id, companyId: company.id, role: 'company_owner' },
      { userId: user.id, venueId: otherVenue.id, role: 'venue_staff' },
    ])

    assert.isFalse(
      await bouncerFor(user)
        .with(MembershipPolicy)
        .allows('assignVenueRole', otherVenue, 'venue_staff')
    )
  })

  test('changing a venue role checks the current role, next role, and venue', async ({
    assert,
  }) => {
    const [admin, owner, manager, targetStaff, targetManager] = await Promise.all([
      createUser('membership-policy-change-admin@example.com'),
      createUser('membership-policy-change-owner@example.com'),
      createUser('membership-policy-change-manager@example.com'),
      createUser('membership-policy-change-target-staff@example.com'),
      createUser('membership-policy-change-target-manager@example.com'),
    ])
    const company = await Company.create({ name: 'Role Change Coffee' })
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Role Change Venue' }),
      Venue.create({ companyId: company.id, name: 'Other Role Change Venue' }),
    ])

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
    ])
    const [staffMembership, managerMembership] = await Promise.all([
      Membership.create({
        userId: targetStaff.id,
        venueId: venue.id,
        role: 'venue_staff',
      }),
      Membership.create({
        userId: targetManager.id,
        venueId: venue.id,
        role: 'venue_manager',
      }),
    ])

    assert.isTrue(
      await bouncerFor(admin)
        .with(MembershipPolicy)
        .allows('changeVenueRole', staffMembership, venue, 'venue_manager')
    )
    assert.isTrue(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('changeVenueRole', staffMembership, venue, 'venue_manager')
    )
    assert.isFalse(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('changeVenueRole', staffMembership, venue, 'venue_manager')
    )
    assert.isFalse(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('changeVenueRole', managerMembership, venue, 'venue_staff')
    )
    assert.isFalse(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('changeVenueRole', staffMembership, otherVenue, 'venue_manager')
    )
  })

  test('revoking a venue role respects role hierarchy and venue scope', async ({ assert }) => {
    const [admin, owner, manager, targetStaff, targetManager] = await Promise.all([
      createUser('membership-policy-revoke-admin@example.com'),
      createUser('membership-policy-revoke-owner@example.com'),
      createUser('membership-policy-revoke-manager@example.com'),
      createUser('membership-policy-revoke-target-staff@example.com'),
      createUser('membership-policy-revoke-target-manager@example.com'),
    ])
    const company = await Company.create({ name: 'Role Revocation Coffee' })
    const [venue, otherVenue] = await Promise.all([
      Venue.create({ companyId: company.id, name: 'Role Revocation Venue' }),
      Venue.create({ companyId: company.id, name: 'Other Role Revocation Venue' }),
    ])

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
      { userId: manager.id, venueId: venue.id, role: 'venue_manager' },
    ])
    const [staffMembership, managerMembership] = await Promise.all([
      Membership.create({
        userId: targetStaff.id,
        venueId: venue.id,
        role: 'venue_staff',
      }),
      Membership.create({
        userId: targetManager.id,
        venueId: venue.id,
        role: 'venue_manager',
      }),
    ])

    assert.isTrue(
      await bouncerFor(admin)
        .with(MembershipPolicy)
        .allows('revokeVenueRole', managerMembership, venue)
    )
    assert.isTrue(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('revokeVenueRole', managerMembership, venue)
    )
    assert.isTrue(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('revokeVenueRole', staffMembership, venue)
    )
    assert.isFalse(
      await bouncerFor(manager)
        .with(MembershipPolicy)
        .allows('revokeVenueRole', managerMembership, venue)
    )
    assert.isFalse(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('revokeVenueRole', staffMembership, otherVenue)
    )
  })

  test('only an admin may revoke a company owner', async ({ assert }) => {
    const [admin, owner, targetOwner, staff] = await Promise.all([
      createUser('membership-policy-owner-revoke-admin@example.com'),
      createUser('membership-policy-owner-revoke-owner@example.com'),
      createUser('membership-policy-owner-revoke-target@example.com'),
      createUser('membership-policy-owner-revoke-staff@example.com'),
    ])
    const [company, otherCompany] = await Promise.all([
      Company.create({ name: 'Owner Revocation Coffee' }),
      Company.create({ name: 'Other Owner Revocation Coffee' }),
    ])
    const venue = await Venue.create({ companyId: company.id, name: 'Owner Revocation Venue' })

    await Membership.createMany([
      { userId: admin.id, role: 'admin' },
      { userId: owner.id, companyId: company.id, role: 'company_owner' },
    ])
    const [targetOwnerMembership, staffMembership] = await Promise.all([
      Membership.create({
        userId: targetOwner.id,
        companyId: company.id,
        role: 'company_owner',
      }),
      Membership.create({ userId: staff.id, venueId: venue.id, role: 'venue_staff' }),
    ])

    assert.isTrue(
      await bouncerFor(admin)
        .with(MembershipPolicy)
        .allows('revokeCompanyOwner', targetOwnerMembership, company)
    )
    assert.isFalse(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('revokeCompanyOwner', targetOwnerMembership, company)
    )
    assert.isFalse(
      await bouncerFor(admin)
        .with(MembershipPolicy)
        .allows('revokeCompanyOwner', staffMembership, company)
    )
    assert.isFalse(
      await bouncerFor(admin)
        .with(MembershipPolicy)
        .allows('revokeCompanyOwner', targetOwnerMembership, otherCompany)
    )
  })

  test('only an admin may revoke another platform admin', async ({ assert }) => {
    const [admin, targetAdmin, owner] = await Promise.all([
      createUser('membership-policy-admin-revoke-actor@example.com'),
      createUser('membership-policy-admin-revoke-target@example.com'),
      createUser('membership-policy-admin-revoke-owner@example.com'),
    ])
    const company = await Company.create({ name: 'Admin Revocation Coffee' })

    await Membership.create({ userId: admin.id, role: 'admin' })
    const [targetAdminMembership, ownerMembership] = await Promise.all([
      Membership.create({ userId: targetAdmin.id, role: 'admin' }),
      Membership.create({
        userId: owner.id,
        companyId: company.id,
        role: 'company_owner',
      }),
    ])

    assert.isTrue(
      await bouncerFor(admin)
        .with(MembershipPolicy)
        .allows('revokePlatformAdmin', targetAdminMembership)
    )
    assert.isFalse(
      await bouncerFor(owner)
        .with(MembershipPolicy)
        .allows('revokePlatformAdmin', targetAdminMembership)
    )
    assert.isFalse(
      await bouncerFor(admin).with(MembershipPolicy).allows('revokePlatformAdmin', ownerMembership)
    )
  })
})
