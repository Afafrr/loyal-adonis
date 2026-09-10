import { rolePermissions } from '#authorization/roles'
import Company from '#models/company'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import Membership from '#models/membership'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'

async function createStamp(params: {
  email: string
  identifier: string
  program: LoyaltyProgram
  venue: Venue
}) {
  const customer = await User.create({
    email: params.email,
    encryptedPassword: 'password123',
  })
  const account = await LoyaltyAccount.create({
    userId: customer.id,
    loyaltyProgramId: params.program.id,
  })
  const tag = await NfcTag.create({
    venueId: params.venue.id,
    identifier: params.identifier,
  })
  await Stamp.create({
    loyaltyAccountId: account.id,
    nfcTagId: tag.id,
    nfcCounter: 1,
  })
}

test.group('Business dashboard', () => {
  test('returns the whole company scope and permissions for a company owner', async ({
    client,
    assert,
  }) => {
    const owner = await User.create({
      email: 'owner-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Dashboard Coffee' })
    const program = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Coffee Club',
      rewardTitle: 'Free coffee',
      stampsRequired: 10,
      active: true,
    })
    const [mainVenue] = await Venue.createMany([
      { companyId: company.id, name: 'Main venue', city: 'Kraków' },
      { companyId: company.id, name: 'Second venue', city: 'Warszawa' },
    ])
    await Membership.create({ userId: owner.id, companyId: company.id, role: 'company_owner' })
    await createStamp({
      email: 'owner-dashboard-customer@example.com',
      identifier: 'owner-dashboard-tag',
      program,
      venue: mainVenue,
    })

    const login = await signIn(client, owner.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      view: string
      scope: { type: string; companyId: number }
      company: { access: unknown[] }
      program: { name: string; active: boolean } | null
      venues: Array<{ name: string; access: unknown[] }>
    }
    assert.equal(dashboard.view, 'company')
    assert.deepEqual(dashboard.scope, { type: 'company', companyId: Number(company.id) })
    assert.deepEqual(dashboard.company.access, [
      { role: 'company_owner', permissions: rolePermissions.company_owner },
    ])
    assert.deepInclude(dashboard.program, {
      name: 'Coffee Club',
      active: true,
    })
    assert.deepEqual(
      dashboard.venues.map((venue) => venue.name),
      ['Main venue', 'Second venue']
    )
    assert.deepEqual(dashboard.venues[1].access, [
      { role: 'company_owner', permissions: rolePermissions.company_owner },
    ])

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', sessionCookie(login))

    statsResponse.assertStatus(200)
    assert.deepEqual(statsResponse.body(), {
      view: 'company',
      scope: { type: 'company', companyId: Number(company.id) },
      stats: {
        customerCount: 1,
        stampCount: 1,
        earnedRewardCount: 0,
        activeTagCount: 1,
      },
      warnings: [],
    })
  })

  test('limits a venue manager to assigned venues and returns manager permissions', async ({
    client,
    assert,
  }) => {
    const manager = await User.create({
      email: 'manager-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Managed Coffee' })
    const program = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Managed Club',
      rewardTitle: 'Free cake',
      stampsRequired: 8,
      active: true,
    })
    const [assignedVenue, hiddenVenue] = await Venue.createMany([
      { companyId: company.id, name: 'Assigned venue' },
      { companyId: company.id, name: 'Hidden venue' },
    ])
    await Membership.create({
      userId: manager.id,
      venueId: assignedVenue.id,
      role: 'venue_manager',
    })
    await Promise.all([
      createStamp({
        email: 'manager-visible-customer@example.com',
        identifier: 'manager-visible-tag',
        program,
        venue: assignedVenue,
      }),
      createStamp({
        email: 'manager-hidden-customer@example.com',
        identifier: 'manager-hidden-tag',
        program,
        venue: hiddenVenue,
      }),
    ])

    const login = await signIn(client, manager.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      view: string
      scope: { type: string; companyId: number; venueIds: number[] }
      company: { access: unknown[] }
      venues: Array<{ name: string; access: unknown[] }>
    }
    assert.equal(dashboard.view, 'company')
    assert.deepEqual(dashboard.scope, {
      type: 'venue',
      companyId: Number(company.id),
      venueIds: [Number(assignedVenue.id)],
    })
    assert.deepEqual(dashboard.company.access, [])
    assert.deepEqual(
      dashboard.venues.map((venue) => venue.name),
      ['Assigned venue']
    )
    assert.deepEqual(dashboard.venues[0].access, [
      { role: 'venue_manager', permissions: rolePermissions.venue_manager },
    ])

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', sessionCookie(login))

    statsResponse.assertStatus(200)
    statsResponse.assertBodyContains({
      stats: { customerCount: 1, stampCount: 1, activeTagCount: 1 },
    })
  })

  test('returns only staff permissions and hides an inactive program from venue staff', async ({
    client,
    assert,
  }) => {
    const staff = await User.create({
      email: 'staff-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Staff Coffee' })
    await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Inactive Club',
      rewardTitle: 'Old reward',
      stampsRequired: 5,
      active: false,
    })
    const venue = await Venue.create({ companyId: company.id, name: 'Staff venue' })
    await Membership.create({ userId: staff.id, venueId: venue.id, role: 'venue_staff' })

    const login = await signIn(client, staff.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      program: unknown
      venues: Array<{ access: unknown[] }>
    }
    assert.equal(dashboard.program, null)
    assert.deepEqual(dashboard.venues[0].access, [
      { role: 'venue_staff', permissions: rolePermissions.venue_staff },
    ])
  })

  test('returns company selection instead of aggregating several companies', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const [firstCompany, secondCompany] = await Company.createMany([
      { name: 'Admin Company A' },
      { name: 'Admin Company B' },
      { name: 'Admin Company Without Venue' },
    ])
    await Venue.createMany([
      { companyId: firstCompany.id, name: 'Admin venue A' },
      { companyId: secondCompany.id, name: 'Admin venue B' },
    ])
    await Membership.create({ userId: admin.id, role: 'admin' })

    const login = await signIn(client, admin.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      view: string
      companies: Array<{ name: string }>
    }
    assert.equal(dashboard.view, 'company_selection')
    assert.deepEqual(
      dashboard.companies.map((company) => company.name),
      ['Admin Company A', 'Admin Company B', 'Admin Company Without Venue']
    )

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', sessionCookie(login))

    statsResponse.assertStatus(409)
    assert.deepEqual(statsResponse.body(), {
      code: 'COMPANY_SELECTION_REQUIRED',
      error: 'Select a company before loading dashboard statistics.',
    })
  })

  test('requires an owner with several companies to select one before loading stats', async ({
    client,
    assert,
  }) => {
    const owner = await User.create({
      email: 'multi-company-owner-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const [firstCompany, secondCompany] = await Company.createMany([
      { name: 'Owner Company A' },
      { name: 'Owner Company B' },
    ])
    await Membership.createMany([
      { userId: owner.id, companyId: firstCompany.id, role: 'company_owner' },
      { userId: owner.id, companyId: secondCompany.id, role: 'company_owner' },
    ])

    const login = await signIn(client, owner.email, 'password123')
    const cookie = sessionCookie(login)
    const dashboardResponse = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', cookie)

    dashboardResponse.assertStatus(200)
    assert.deepEqual(dashboardResponse.body(), {
      view: 'company_selection',
      companies: [
        { id: Number(firstCompany.id), name: 'Owner Company A' },
        { id: Number(secondCompany.id), name: 'Owner Company B' },
      ],
    })

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', cookie)

    statsResponse.assertStatus(409)
    assert.deepEqual(statsResponse.body(), {
      code: 'COMPANY_SELECTION_REQUIRED',
      error: 'Select a company before loading dashboard statistics.',
    })
  })

  test('forbids a customer from both business dashboard endpoints', async ({ client, assert }) => {
    const user = await User.create({
      email: 'customer-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const login = await signIn(client, user.email, 'password123')
    const cookie = sessionCookie(login)

    const [dashboardResponse, statsResponse] = await Promise.all([
      client.get('/api/v1/business/dashboard').header('Cookie', cookie),
      client.get('/api/v1/business/dashboard/stats').header('Cookie', cookie),
    ])

    dashboardResponse.assertStatus(403)
    statsResponse.assertStatus(403)
    assert.deepEqual(dashboardResponse.body(), {
      error: 'You do not have access to a business dashboard.',
    })
    assert.deepEqual(statsResponse.body(), dashboardResponse.body())
  })
})
