export function personalWorkspaceSlug(userId: string): string {
  return `workspace-${userId.slice(0, 8)}`
}

export function isUniqueConstraintError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false
  return error.code === '23505' || /duplicate key|unique constraint/i.test(error.message ?? '')
}
