import Company from '#models/company'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class LoyaltyDemoSeeder extends BaseSeeder {
  async run() {
    const client = { client: this.client }

    const user = await User.updateOrCreate(
      { email: 'member@example.com' },
      { encryptedPassword: 'password123' },
      client
    )

    const firstCompany = await Company.updateOrCreate(
      { name: 'Kawiarnia Północ' },
      { name: 'Kawiarnia Północ' },
      client
    )
    const secondCompany = await Company.updateOrCreate(
      { name: 'Piekarnia Gorunc' },
      { name: 'Piekarnia Gorunc' },
      client
    )

    const firstProgram = await LoyaltyProgram.updateOrCreate(
      { companyId: firstCompany.id },
      {
        companyId: firstCompany.id,
        name: 'Kawa na pieczątki',
        rewardTitle: 'Darmowa kawa',
        stampsRequired: 10,
        active: true,
      },
      client
    )
    const secondProgram = await LoyaltyProgram.updateOrCreate(
      { companyId: secondCompany.id },
      {
        companyId: secondCompany.id,
        name: 'Drożdżówka na pieczątki',
        rewardTitle: 'Darmowa drożdżówka',
        stampsRequired: 5,
        active: true,
      },
      client
    )

    const firstCompanyFirstVenue = await Venue.updateOrCreate(
      { companyId: firstCompany.id, name: 'Śródmieście' },
      { companyId: firstCompany.id, name: 'Śródmieście' },
      client
    )
    const firstCompanySecondVenue = await Venue.updateOrCreate(
      { companyId: firstCompany.id, name: 'Stare Miasto' },
      { companyId: firstCompany.id, name: 'Stare Miasto' },
      client
    )
    const secondCompanyVenue = await Venue.updateOrCreate(
      { companyId: secondCompany.id, name: 'Mokotów' },
      { companyId: secondCompany.id, name: 'Mokotów' },
      client
    )

    const firstTag = await NfcTag.updateOrCreate(
      { identifier: '041C6432A91190' },
      {
        venueId: firstCompanyFirstVenue.id,
        identifier: '041C6432A91190',
        active: true,
        lastAcceptedCounter: 2,
      },
      client
    )
    const secondTag = await NfcTag.updateOrCreate(
      { identifier: '043D6432A91190' },
      {
        venueId: firstCompanySecondVenue.id,
        identifier: '043D6432A91190',
        active: true,
        lastAcceptedCounter: 1,
      },
      client
    )
    const thirdTag = await NfcTag.updateOrCreate(
      { identifier: 'test1' },
      {
        venueId: secondCompanyVenue.id,
        identifier: 'test1',
        active: true,
        lastAcceptedCounter: 1,
      },
      client
    )

    const firstAccount = await LoyaltyAccount.firstOrCreate(
      { userId: user.id, loyaltyProgramId: firstProgram.id },
      {},
      client
    )
    const secondAccount = await LoyaltyAccount.firstOrCreate(
      { userId: user.id, loyaltyProgramId: secondProgram.id },
      {},
      client
    )

    await Stamp.updateOrCreate(
      { nfcTagId: firstTag.id, nfcCounter: 1 },
      { loyaltyAccountId: firstAccount.id, nfcTagId: firstTag.id, nfcCounter: 1 },
      client
    )
    await Stamp.updateOrCreate(
      { nfcTagId: firstTag.id, nfcCounter: 2 },
      { loyaltyAccountId: firstAccount.id, nfcTagId: firstTag.id, nfcCounter: 2 },
      client
    )
    await Stamp.updateOrCreate(
      { nfcTagId: secondTag.id, nfcCounter: 1 },
      { loyaltyAccountId: firstAccount.id, nfcTagId: secondTag.id, nfcCounter: 1 },
      client
    )
    await Stamp.updateOrCreate(
      { nfcTagId: thirdTag.id, nfcCounter: 1 },
      { loyaltyAccountId: secondAccount.id, nfcTagId: thirdTag.id, nfcCounter: 1 },
      client
    )
  }
}
