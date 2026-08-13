import { BaseSchema } from '@adonisjs/lucid/schema'

const membershipRoleConstraint = 'memberships_role_check'
const membershipScopeConstraint = 'memberships_scope_check'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('memberships', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('user_id').notNullable().references('id').inTable('users')
      table.string('role').notNullable()
      table.bigInteger('company_id').nullable().references('id').inTable('companies')
      table.bigInteger('venue_id').nullable().references('id').inTable('venues')
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.index(['user_id'])
      table.index(['company_id'])
      table.index(['venue_id'])
    })

    this.schema.raw(`
      ALTER TABLE memberships
      ADD CONSTRAINT ${membershipRoleConstraint}
      CHECK (role IN ('admin', 'company_owner', 'venue_manager', 'venue_staff')),
      ADD CONSTRAINT ${membershipScopeConstraint}
      CHECK (
        (role = 'admin' AND company_id IS NULL AND venue_id IS NULL)
        OR (role = 'company_owner' AND company_id IS NOT NULL AND venue_id IS NULL)
        OR (role IN ('venue_manager', 'venue_staff') AND company_id IS NULL AND venue_id IS NOT NULL)
      )
    `)

    this.schema.raw(`
      CREATE UNIQUE INDEX memberships_unique_company_member
      ON memberships (user_id, company_id)
      WHERE company_id IS NOT NULL
    `)

    this.schema.raw(`
      CREATE UNIQUE INDEX memberships_unique_venue_member
      ON memberships (user_id, venue_id)
      WHERE venue_id IS NOT NULL
    `)

    this.schema.raw(`
      CREATE UNIQUE INDEX memberships_unique_global_admin
      ON memberships (user_id)
      WHERE role = 'admin'
    `)
  }

  async down() {
    this.schema.dropTable('memberships')
  }
}
