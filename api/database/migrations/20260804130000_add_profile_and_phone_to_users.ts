import { BaseSchema } from '@adonisjs/lucid/schema'

const phoneFormatConstraint = 'users_phone_e_164_format_check'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('first_name').nullable()
      table.string('phone_e_164', 16).nullable().unique()
      table.timestamp('phone_verified_at', { useTz: false, precision: 6 }).nullable()
    })

    this.schema.raw(`
      ALTER TABLE users
      ADD CONSTRAINT ${phoneFormatConstraint}
      CHECK (phone_e_164 IS NULL OR phone_e_164 ~ '^\\+[1-9][0-9]{1,14}$')
    `)
  }

  async down() {
    this.schema.raw(`ALTER TABLE users DROP CONSTRAINT ${phoneFormatConstraint}`)

    this.schema.alterTable('users', (table) => {
      table.dropUnique(['phone_e_164'])
      table.dropColumns('first_name', 'phone_e_164', 'phone_verified_at')
    })
  }
}
