import Stamp from '#models/stamp'
import type { DashboardStatsRange } from '#validators/dashboard'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const rangeDays: Record<DashboardStatsRange, number> = { '7d': 7, '30d': 30, '90d': 90 }
type DailyStampCount = { date: string; count: number | string }

export function getDashboardStatsPeriod(range: DashboardStatsRange = '30d') {
  const today = DateTime.utc().startOf('day')

  return {
    range,
    from: today.minus({ days: rangeDays[range] - 1 }).toISODate()!,
    to: today.toISODate()!,
    timezone: 'UTC' as const,
    interval: 'day' as const,
  }
}

type StatsPeriod = ReturnType<typeof getDashboardStatsPeriod>

export function fillStampSeries(period: StatsPeriod, rows: DailyStampCount[]) {
  const counts = new Map(rows.map((row) => [row.date, Number(row.count)]))
  const start = DateTime.fromISO(period.from, { zone: 'utc' })

  return Array.from({ length: rangeDays[period.range] }, (_, index) => {
    const date = start.plus({ days: index }).toISODate()!
    return { date, count: counts.get(date) ?? 0 }
  })
}

export async function getDashboardStampSeries(venueIds: number[], period: StatsPeriod) {
  if (venueIds.length === 0) return fillStampSeries(period, [])

  const endExclusive = DateTime.fromISO(period.to, { zone: 'utc' }).plus({ days: 1 }).toISODate()!
  // created_at is a timestamp WITHOUT time zone, stored as UTC wall time.
  // Compare the raw column against a half-open interval so an index can be used.
  const dayExpression = "to_char(stamps.created_at, 'YYYY-MM-DD')"
  const rows = await Stamp.query()
    .join('nfc_tags', 'nfc_tags.id', 'stamps.nfc_tag_id')
    .whereIn('nfc_tags.venue_id', venueIds)
    .where('stamps.created_at', '>=', period.from)
    .where('stamps.created_at', '<', endExclusive)
    .select(db.raw(`${dayExpression} as date`))
    .count('stamps.id as count')
    .groupByRaw(dayExpression)
    .pojo<DailyStampCount>()

  return fillStampSeries(period, rows)
}
