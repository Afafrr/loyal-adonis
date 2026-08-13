import { BaseSchema } from '@adonisjs/lucid/schema'

const indexName = 'stamps_unallocated_for_account_order_index'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE INDEX ${indexName}
      ON stamps (loyalty_account_id, created_at ASC, id ASC)
      WHERE earned_reward_id IS NULL
    `)
  }

  async down() {
    this.schema.raw(`DROP INDEX ${indexName}`)
  }
}
