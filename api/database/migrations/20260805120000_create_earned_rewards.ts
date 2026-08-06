import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('earned_rewards', (table) => {
      table.bigIncrements('id').notNullable()
      table
        .bigInteger('loyalty_account_id')
        .notNullable()
        .references('id')
        .inTable('loyalty_accounts')
      table.string('reward_title_snapshot').notNullable()
      table.integer('stamps_required_snapshot').notNullable()
      table.timestamp('earned_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('redeemed_at', { useTz: false, precision: 6 }).nullable()
      table.bigInteger('redeemed_at_venue_id').nullable().references('id').inTable('venues')
      table.bigInteger('redeemed_by_user_id').nullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: false, precision: 6 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 6 }).notNullable()
      table.index(['loyalty_account_id', 'redeemed_at'])
    })

    this.schema.alterTable('stamps', (table) => {
      table.bigInteger('earned_reward_id').nullable().references('id').inTable('earned_rewards')
      table.index(['earned_reward_id'])
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        DO $$
        DECLARE
          completed_batch RECORD;
          new_reward_id BIGINT;
        BEGIN
          FOR completed_batch IN
            WITH ranked_stamps AS (
              SELECT
                stamps.id AS stamp_id,
                stamps.loyalty_account_id,
                stamps.created_at,
                loyalty_programs.reward_title,
                loyalty_programs.stamps_required,
                ROW_NUMBER() OVER (
                  PARTITION BY stamps.loyalty_account_id
                  ORDER BY stamps.created_at ASC, stamps.id ASC
                ) AS stamp_number,
                COUNT(*) OVER (
                  PARTITION BY stamps.loyalty_account_id
                ) AS total_stamps
              FROM stamps
              INNER JOIN loyalty_accounts
                ON loyalty_accounts.id = stamps.loyalty_account_id
              INNER JOIN loyalty_programs
                ON loyalty_programs.id = loyalty_accounts.loyalty_program_id
              WHERE loyalty_programs.stamps_required > 0
            )
            SELECT
              loyalty_account_id,
              ((stamp_number - 1) / stamps_required)::integer AS batch_number,
              reward_title,
              stamps_required,
              MAX(created_at) AS earned_at,
              ARRAY_AGG(stamp_id ORDER BY stamp_number) AS stamp_ids
            FROM ranked_stamps
            WHERE stamp_number <= total_stamps - (total_stamps % stamps_required)
            GROUP BY
              loyalty_account_id,
              ((stamp_number - 1) / stamps_required)::integer,
              reward_title,
              stamps_required
            ORDER BY loyalty_account_id, batch_number
          LOOP
            INSERT INTO earned_rewards (
              loyalty_account_id,
              reward_title_snapshot,
              stamps_required_snapshot,
              earned_at,
              created_at,
              updated_at
            )
            VALUES (
              completed_batch.loyalty_account_id,
              completed_batch.reward_title,
              completed_batch.stamps_required,
              completed_batch.earned_at,
              completed_batch.earned_at,
              completed_batch.earned_at
            )
            RETURNING id INTO new_reward_id;

            UPDATE stamps
            SET earned_reward_id = new_reward_id
            WHERE id = ANY(completed_batch.stamp_ids);
          END LOOP;
        END $$;
      `)
    })
  }

  async down() {
    this.schema.alterTable('stamps', (table) => {
      table.dropColumn('earned_reward_id')
    })
    this.schema.dropTable('earned_rewards')
  }
}
