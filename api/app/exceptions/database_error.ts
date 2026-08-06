export function isPostgresUniqueConstraintViolation(error: unknown, constraint: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === constraint
  )
}
