import path from 'path'

export function getHelpCenterRoot(): string {
  const env = process.env.HELP_CENTER_ROOT?.trim()
  if (env) return env
  return path.join(process.cwd(), '..', 'help-center')
}

export function helpArticlesRoot(): string {
  return path.join(getHelpCenterRoot(), 'articles')
}
