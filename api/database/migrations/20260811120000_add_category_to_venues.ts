import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('venues', (table) => {
      table.string('category').nullable()
    })
  }

  async down() {
    this.schema.alterTable('venues', (table) => {
      table.dropColumn('category')
    })
  }
}
