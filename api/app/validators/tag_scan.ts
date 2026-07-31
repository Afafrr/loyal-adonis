import vine from '@vinejs/vine'

const encryptedParameter = () =>
  vine
    .string()
    .trim()
    .regex(/^[0-9a-f]+$/i)
    .maxLength(1024)

export const tagScanValidator = vine.create({
  picc_data: encryptedParameter(),
  enc: encryptedParameter(),
  cmac: encryptedParameter(),
})
