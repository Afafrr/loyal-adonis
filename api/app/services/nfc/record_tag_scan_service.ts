import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import db from '@adonisjs/lucid/services/db'

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
  loyaltyAccountId: number
  stampId: number
  venueId: number
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

      const loyaltyAccount = await LoyaltyAccount.firstOrCreate(
        {
          userId: Number(params.userId),
          loyaltyProgramId: loyaltyProgram.id,
        },
        {},
        { client: trx }
      )

      const stamp = await Stamp.create(
        {
          loyaltyAccountId: loyaltyAccount.id,
          nfcTagId: tag.id,
          nfcCounter: params.readCounter,
        },
        { client: trx }
      )

      return {
        loyaltyAccountId: Number(loyaltyAccount.id),
        stampId: Number(stamp.id),
        venueId: Number(tag.venueId),
      }
    })
  } catch (error) {
    if (error instanceof TagScanError) throw error

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new TagScanError('This NFC scan has already been accepted.', 409)
    }

    throw error
  }
}
