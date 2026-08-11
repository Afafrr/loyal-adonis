import Company from '#models/company'
import EarnedReward from '#models/earned_reward'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class LoyaltyDemoSeeder extends BaseSeeder {
  async run() {
    const member = await this.seedMember()
    const coffeeShop = await this.seedCoffeeShop()
    const bakery = await this.seedBakery()

    const coffeeAccount = await this.seedAccount(member, coffeeShop.program)
    const bakeryAccount = await this.seedAccount(member, bakery.program)

    await this.seedReward(coffeeAccount, coffeeShop.program)
    await this.seedStamps(coffeeAccount, bakeryAccount, coffeeShop.tags, bakery.tag)
  }

  private seedMember() {
    return User.updateOrCreate(
      { email: 'member@example.com' },
      {
        encryptedPassword: 'password123',
        firstName: 'Marta',
        phoneE164: '+48501123456',
        phoneVerifiedAt: DateTime.fromISO('2026-08-04T12:00:00Z'),
      },
      { client: this.client }
    )
  }

  private async seedCoffeeShop() {
    const company = await Company.updateOrCreate(
      { name: 'Kawiarnia Północ' },
      { name: 'Kawiarnia Północ' },
      { client: this.client }
    )
    const program = await LoyaltyProgram.updateOrCreate(
      { companyId: company.id },
      {
        companyId: company.id,
        name: 'Kawa na pieczątki',
        rewardTitle: 'Darmowa kawa',
        stampsRequired: 10,
        active: true,
      },
      { client: this.client }
    )

    const downtownVenue = await Venue.updateOrCreate(
      { companyId: company.id, name: 'Śródmieście' },
      {
        companyId: company.id,
        name: 'Śródmieście',
        category: 'cafe',
        addressLine1: 'ul. Marszałkowska 10',
        postalCode: '00-590',
        city: 'Warszawa',
        countryCode: 'PL',
        latitude: '52.221617',
        longitude: '21.014272',
      },
      { client: this.client }
    )
    const oldTownVenue = await Venue.updateOrCreate(
      { companyId: company.id, name: 'Stare Miasto' },
      {
        companyId: company.id,
        name: 'Stare Miasto',
        category: 'cafe',
        addressLine1: 'ul. Freta 10',
        postalCode: '00-227',
        city: 'Warszawa',
        countryCode: 'PL',
        latitude: '52.251623',
        longitude: '21.010097',
      },
      { client: this.client }
    )

    const downtownTag = await NfcTag.updateOrCreate(
      { identifier: '041C6432A91190' },
      {
        venueId: downtownVenue.id,
        identifier: '041C6432A91190',
        active: true,
        lastAcceptedCounter: 2,
      },
      { client: this.client }
    )
    const oldTownTag = await NfcTag.updateOrCreate(
      { identifier: '043D6432A91190' },
      {
        venueId: oldTownVenue.id,
        identifier: '043D6432A91190',
        active: true,
        lastAcceptedCounter: 1,
      },
      { client: this.client }
    )

    return { program, tags: { downtown: downtownTag, oldTown: oldTownTag } }
  }

  private async seedBakery() {
    const company = await Company.updateOrCreate(
      { name: 'Piekarnia Gorunc' },
      { name: 'Piekarnia Gorunc' },
      { client: this.client }
    )
    const program = await LoyaltyProgram.updateOrCreate(
      { companyId: company.id },
      {
        companyId: company.id,
        name: 'Drożdżówka na pieczątki',
        rewardTitle: 'Darmowa drożdżówka',
        stampsRequired: 5,
        active: true,
      },
      { client: this.client }
    )
    const venue = await Venue.updateOrCreate(
      { companyId: company.id, name: 'Mokotów' },
      {
        companyId: company.id,
        name: 'Mokotów',
        category: 'bakery',
        addressLine1: 'ul. Puławska 2',
        postalCode: '02-566',
        city: 'Warszawa',
        countryCode: 'PL',
        latitude: '52.209124',
        longitude: '21.019510',
      },
      { client: this.client }
    )
    const tag = await NfcTag.updateOrCreate(
      { identifier: 'test1' },
      {
        venueId: venue.id,
        identifier: 'test1',
        active: true,
        lastAcceptedCounter: 1,
      },
      { client: this.client }
    )

    return { program, tag }
  }

  private seedAccount(user: User, program: LoyaltyProgram) {
    return LoyaltyAccount.firstOrCreate(
      { userId: user.id, loyaltyProgramId: program.id },
      {},
      { client: this.client }
    )
  }

  private async seedReward(account: LoyaltyAccount, program: LoyaltyProgram) {
    const rewardEarnedAt = DateTime.fromISO('2026-08-04T12:00:00Z')
    await EarnedReward.updateOrCreate(
      { loyaltyAccountId: account.id, earnedAt: rewardEarnedAt },
      {
        loyaltyAccountId: account.id,
        rewardTitleSnapshot: program.rewardTitle,
        stampsRequiredSnapshot: program.stampsRequired,
        earnedAt: rewardEarnedAt,
      },
      { client: this.client }
    )
  }

  private async seedStamps(
    coffeeAccount: LoyaltyAccount,
    bakeryAccount: LoyaltyAccount,
    coffeeTags: { downtown: NfcTag; oldTown: NfcTag },
    bakeryTag: NfcTag
  ) {
    await Stamp.updateOrCreate(
      { nfcTagId: coffeeTags.downtown.id, nfcCounter: 1 },
      {
        loyaltyAccountId: coffeeAccount.id,
        nfcTagId: coffeeTags.downtown.id,
        nfcCounter: 1,
      },
      { client: this.client }
    )
    await Stamp.updateOrCreate(
      { nfcTagId: coffeeTags.downtown.id, nfcCounter: 2 },
      {
        loyaltyAccountId: coffeeAccount.id,
        nfcTagId: coffeeTags.downtown.id,
        nfcCounter: 2,
      },
      { client: this.client }
    )
    await Stamp.updateOrCreate(
      { nfcTagId: coffeeTags.oldTown.id, nfcCounter: 1 },
      { loyaltyAccountId: coffeeAccount.id, nfcTagId: coffeeTags.oldTown.id, nfcCounter: 1 },
      { client: this.client }
    )
    await Stamp.updateOrCreate(
      { nfcTagId: bakeryTag.id, nfcCounter: 1 },
      { loyaltyAccountId: bakeryAccount.id, nfcTagId: bakeryTag.id, nfcCounter: 1 },
      { client: this.client }
    )
  }
}
