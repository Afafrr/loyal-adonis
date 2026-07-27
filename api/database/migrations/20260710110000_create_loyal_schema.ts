import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('companies', (table) => {
      table.bigIncrements('id').notNullable()
      table.string('name').notNullable()
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
    })

    this.schema.createTable('venues', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('company_id').notNullable().references('id').inTable('companies')
      table.string('name').notNullable()
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.index(['company_id'])
    })

    this.schema.createTable('loyalty_programs', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('company_id').notNullable().references('id').inTable('companies')
      table.string('name').notNullable()
      table.string('reward_title').notNullable()
      table.integer('stamps_required').notNullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.unique(['company_id'])
    })

    this.schema.createTable('nfc_tags', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('venue_id').notNullable().references('id').inTable('venues')
      table.string('identifier').notNullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.bigInteger('last_accepted_counter').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.unique(['identifier'])
      table.index(['venue_id'])
    })

    this.schema.createTable('users', (table) => {
      table.bigIncrements('id').notNullable()
      table.string('email').notNullable()
      table.string('encrypted_password').notNullable()
      table.string('reset_password_token').nullable()
      table.timestamp('reset_password_sent_at', { useTz: false, precision: 6 }).nullable()
      table.timestamp('remember_created_at', { useTz: false, precision: 6 }).nullable()
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.unique(['email'])
      table.unique(['reset_password_token'])
    })

    this.schema.createTable('loyalty_accounts', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('user_id').notNullable().references('id').inTable('users')
      table
        .bigInteger('loyalty_program_id')
        .notNullable()
        .references('id')
        .inTable('loyalty_programs')
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.index(['user_id'])
      table.index(['loyalty_program_id'])
      table.unique(['user_id', 'loyalty_program_id'])
    })

    this.schema.createTable('stamps', (table) => {
      table.bigIncrements('id').notNullable()
      table
        .bigInteger('loyalty_account_id')
        .notNullable()
        .references('id')
        .inTable('loyalty_accounts')
      table.bigInteger('nfc_tag_id').notNullable().references('id').inTable('nfc_tags')
      table.bigInteger('nfc_counter').notNullable()
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.index(['loyalty_account_id'])
      table.index(['nfc_tag_id'])
      table.unique(['nfc_tag_id', 'nfc_counter'])
    })
  }

  async down() {
    this.schema.dropTable('stamps')
    this.schema.dropTable('loyalty_accounts')
    this.schema.dropTable('users')
    this.schema.dropTable('nfc_tags')
    this.schema.dropTable('loyalty_programs')
    this.schema.dropTable('venues')
    this.schema.dropTable('companies')
  }
}
