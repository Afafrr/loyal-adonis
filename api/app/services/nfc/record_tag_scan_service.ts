import EarnedReward from '#models/earned_reward'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export interface RecordTagScanParams {
  userId: number | bigint
  tagIdentifier: string
  readCounter: number
}

export class TagScanError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409
  ) {
    super(message)
  }
}

export interface RecordedTagScan {
  earnedReward: EarnedRewardSummary | null
  loyaltyAccountId: number
  progress: {
    collectedStamps: number
    stampsRequired: number
  }
  stampId: number
  venueId: number
}

interface EarnedRewardSummary {
  earnedAt: string
  id: number
  title: string
}

export async function recordTagScan(params: RecordTagScanParams): Promise<RecordedTagScan> {
  try {
    return await db.transaction(async (trx) => {
      const tag = await NfcTag.query({ client: trx })
        .where('identifier', params.tagIdentifier)
        .where('active', true)
        .preload('venue')
        .first()

      if (!tag) {
        throw new TagScanError('NFC tag was not found or is inactive.', 404)
      }

      const loyaltyProgram = await LoyaltyProgram.query({ client: trx })
        .where('company_id', Number(tag.venue.companyId))
        .where('active', true)
        .first()

      if (!loyaltyProgram) {
        throw new TagScanError('This venue does not have an active loyalty program.', 404)
      }

      // Serialize first scans, when the loyalty account row does not exist and cannot be locked yet.
      await trx.rawQuery('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
        `loyalty-account:${params.userId}:${loyaltyProgram.id}`,
      ])

      const loyaltyAccount = await LoyaltyAccount.firstOrCreate(
        {
          userId: Number(params.userId),
          loyaltyProgramId: loyaltyProgram.id,
        },
        {},
        { client: trx }
      )

      const lockedLoyaltyAccount = await LoyaltyAccount.query({ client: trx })
        .where('id', Number(loyaltyAccount.id))
        .forUpdate()
        .firstOrFail()

      // validation of stampsRequired
      if (!Number.isInteger(loyaltyProgram.stampsRequired) || loyaltyProgram.stampsRequired < 1) {
        throw new Error(`Loyalty program ${loyaltyProgram.id} has an invalid stamp threshold.`)
      }

      const stamp = await Stamp.create(
        {
          loyaltyAccountId: lockedLoyaltyAccount.id,
          nfcTagId: tag.id,
          nfcCounter: params.readCounter,
        },
        { client: trx }
      )

      // Award a reward if the user has collected enough stamps
      const { earnedReward, progressStampCount } = await awardRewardIfReady({
        client: trx,
        loyaltyAccountId: Number(lockedLoyaltyAccount.id),
        rewardTitle: loyaltyProgram.rewardTitle,
        stampsRequired: loyaltyProgram.stampsRequired,
      })

      const earnedRewardSummary = earnedReward ? toEarnedRewardSummary(earnedReward) : null

      return {
        earnedReward: earnedRewardSummary,
        loyaltyAccountId: Number(lockedLoyaltyAccount.id),
        progress: {
          collectedStamps: progressStampCount,
          stampsRequired: loyaltyProgram.stampsRequired,
        },
        stampId: Number(stamp.id),
        venueId: Number(tag.venueId),
      }
    })
  } catch (error) {
    if (error instanceof TagScanError) throw error

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505' &&
      'constraint' in error &&
      error.constraint === 'stamps_nfc_tag_id_nfc_counter_unique'
    ) {
      throw new TagScanError('This NFC scan has already been accepted.', 409)
    }

    throw error
  }
}

async function awardRewardIfReady(params: {
  client: TransactionClientContract
  loyaltyAccountId: number
  rewardTitle: string
  stampsRequired: number
}) {
  const unallocatedStamps = await Stamp.query({ client: params.client })
    .where('loyalty_account_id', params.loyaltyAccountId)
    .whereNull('earned_reward_id')
    .orderBy('created_at', 'asc')
    .orderBy('id', 'asc')
    .limit(params.stampsRequired)
    .forUpdate()

  if (unallocatedStamps.length < params.stampsRequired) {
    return {
      earnedReward: null,
      progressStampCount: unallocatedStamps.length,
    }
  }

  const earnedReward = await EarnedReward.create(
    {
      earnedAt: unallocatedStamps.at(-1)!.createdAt, //takes last stamp's createdAt
      loyaltyAccountId: params.loyaltyAccountId,
      rewardTitleSnapshot: params.rewardTitle,
      stampsRequiredSnapshot: params.stampsRequired,
    },
    { client: params.client }
  )

  // Assigns earned reward to the stamps that were used to earn it
  await Stamp.query({ client: params.client })
    .whereIn(
      'id',
      unallocatedStamps.map((stamp) => Number(stamp.id))
    )
    .update({ earnedRewardId: earnedReward.id })

  return {
    earnedReward,
    progressStampCount: 0,
  }
}

function toEarnedRewardSummary(earnedReward: EarnedReward): EarnedRewardSummary {
  return {
    earnedAt: earnedReward.earnedAt.toUTC().toISO()!,
    id: Number(earnedReward.id),
    title: earnedReward.rewardTitleSnapshot,
  }
}
