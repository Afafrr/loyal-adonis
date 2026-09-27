import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('stamps', (table) => {
      table.index(['nfc_tag_id', 'created_at'], 'stamps_tag_created_at_index')
      table.dropIndex(['nfc_tag_id'])
    })
  }

  async down() {
    this.schema.alterTable('stamps', (table) => {
      table.dropIndex(['nfc_tag_id', 'created_at'], 'stamps_tag_created_at_index')
      table.index(['nfc_tag_id'])
    })
  }
}
