import vine from '@vinejs/vine'

export const dashboardQueryValidator = vine.create({
  companyId: vine.number().positive().withoutDecimals().max(Number.MAX_SAFE_INTEGER).optional(),
  venueId: vine.number().positive().withoutDecimals().max(Number.MAX_SAFE_INTEGER).optional(),
})
