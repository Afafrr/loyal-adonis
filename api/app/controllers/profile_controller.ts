import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

type ProfileStatsRow = {
  active_program_count: number | string
  visit_count: number | string
}

export default class ProfileController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const stats = (await db
      .from('loyalty_accounts')
      .innerJoin('loyalty_programs', 'loyalty_programs.id', 'loyalty_accounts.loyalty_program_id')
      .leftJoin('stamps', 'stamps.loyalty_account_id', 'loyalty_accounts.id')
      .where('loyalty_accounts.user_id', Number(user.id))
      .count('stamps.id as visit_count')
      .select(
        db.raw(
          'COUNT(DISTINCT loyalty_accounts.loyalty_program_id) FILTER (WHERE loyalty_programs.active) AS active_program_count'
        )
      )
      .first()) as ProfileStatsRow | undefined

    return {
      id: Number(user.id),
      email: user.email,
      firstName: user.firstName,
      phoneE164: user.phoneE164,
      phoneVerifiedAt: user.phoneVerifiedAt?.toUTC().toISO() ?? null,
      createdAt: user.createdAt.toUTC().toISO(),
      visitCount: Number(stats?.visit_count ?? 0),
      activeProgramCount: Number(stats?.active_program_count ?? 0),
    }
  }
}
