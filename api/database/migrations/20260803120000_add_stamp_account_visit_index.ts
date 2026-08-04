import { BaseSchema } from '@adonisjs/lucid/schema'

const indexName = 'stamps_loyalty_account_created_at_desc_index'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`CREATE INDEX ${indexName} ON stamps (loyalty_account_id, created_at DESC)`)
  }

  async down() {
    this.schema.raw(`DROP INDEX ${indexName}`)
  }
}
