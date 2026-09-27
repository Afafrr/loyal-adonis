import vine from '@vinejs/vine'

const dashboardFilters = {
  companyId: vine.number().positive().withoutDecimals().max(Number.MAX_SAFE_INTEGER).optional(),
  venueId: vine.number().positive().withoutDecimals().max(Number.MAX_SAFE_INTEGER).optional(),
}

export const dashboardStatsRanges = ['7d', '30d', '90d'] as const
export type DashboardStatsRange = (typeof dashboardStatsRanges)[number]

export const dashboardQueryValidator = vine.create(dashboardFilters)

export const dashboardStatsQueryValidator = vine.create({
  ...dashboardFilters,
  range: vine.enum(dashboardStatsRanges).optional(),
})
