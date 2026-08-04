import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('venues', (table) => {
      table.string('address_line_1').nullable()
      table.string('address_line_2').nullable()
      table.string('postal_code').nullable()
      table.string('city').nullable()
      table.string('country_code', 2).nullable()
      table.decimal('latitude', 9, 6).nullable()
      table.decimal('longitude', 9, 6).nullable()
    })
  }

  async down() {
    this.schema.alterTable('venues', (table) => {
      table.dropColumns(
        'address_line_1',
        'address_line_2',
        'postal_code',
        'city',
        'country_code',
        'latitude',
        'longitude'
      )
    })
  }
}
