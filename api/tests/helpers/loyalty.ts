import Company from '#models/company'
import LoyaltyProgram from '#models/loyalty_program'
import Venue from '#models/venue'

type CompanyWithProgramOptions = {
  companyName?: string
  programName?: string
  rewardTitle?: string
  stampsRequired?: number
}

type VenueAttributes = {
  name: string
  category?: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  city?: string
  countryCode?: string
}

export async function createCompanyWithProgram({
  companyName = 'Coffee Co.',
  programName = 'Coffee stamps',
  rewardTitle = 'Free coffee',
  stampsRequired = 10,
}: CompanyWithProgramOptions = {}) {
  const company = await Company.create({ name: companyName })
  const loyaltyProgram = await LoyaltyProgram.create({
    companyId: company.id,
    name: programName,
    rewardTitle,
    stampsRequired,
    active: true,
  })

  return { company, loyaltyProgram }
}

export function createVenues(companyId: number | bigint, venues: VenueAttributes[]) {
  return Promise.all(venues.map((venue) => Venue.create({ companyId, ...venue })))
}
