/**
 * One-off refactor: rename createAdminClient → createServiceRoleSupabaseClient
 * in sudar-learn/src and sudar-studio/src (skips heavy dirs).
 */
import fs from 'node:fs'
import path from 'node:path'

const roots = ['sudar-learn/src', 'sudar-studio/src']
const skip = new Set(['node_modules', '.next', 'dist', 'build'])

function walk(dir, fn) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (skip.has(e.name)) continue
    if (e.isDirectory()) walk(p, fn)
    else if (/\.(ts|tsx)$/.test(e.name)) fn(p)
  }
}

let n = 0
for (const root of roots) {
  walk(root, (p) => {
    let s = fs.readFileSync(p, 'utf8')
    if (!s.includes('createAdminClient')) return
    fs.writeFileSync(p, s.split('createAdminClient').join('createServiceRoleSupabaseClient'))
    n++
  })
}
console.log('updated files:', n)
