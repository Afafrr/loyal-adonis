import { BaseSchema } from '@adonisjs/lucid/schema'

const uniqueConstraintName = 'earned_rewards_loyalty_account_id_cycle_number_unique'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery('ALTER TABLE earned_rewards DROP COLUMN IF EXISTS cycle_number')
  }

  async down() {
    this.schema.alterTable('earned_rewards', (table) => {
      table.integer('cycle_number').nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        WITH numbered_rewards AS (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY loyalty_account_id
              ORDER BY earned_at ASC, id ASC
            ) AS cycle_number
          FROM earned_rewards
        )
        UPDATE earned_rewards
        SET cycle_number = numbered_rewards.cycle_number
        FROM numbered_rewards
        WHERE earned_rewards.id = numbered_rewards.id
      `)
    })

    this.schema.alterTable('earned_rewards', (table) => {
      table.integer('cycle_number').notNullable().alter()
      table.unique(['loyalty_account_id', 'cycle_number'], {
        indexName: uniqueConstraintName,
      })
    })
  }
}
