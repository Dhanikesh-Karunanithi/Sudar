/**
 * Removes Next.js output dirs so `dev:fresh` works after EPERM locks on Windows.
 * Default `.next` under the app folder + Windows distDir under %TEMP% (see next.config.mjs).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const studioRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dirs = [
  path.join(studioRoot, '.next'),
  path.join(os.tmpdir(), 'byteos-studio-next'),
]

for (const dir of dirs) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* locked or missing */
  }
}
