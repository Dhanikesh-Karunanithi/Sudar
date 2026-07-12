#!/usr/bin/env node
/**
 * Build Cursor-branded course card / banner PNGs with sharp.
 *
 * Usage: node portfolio/cursor-education/scripts/make-course-cards.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require(join(process.cwd(), 'sudar-studio/node_modules/sharp'))

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const brand = join(root, 'brand')
const outDir = join(brand, 'cards')
mkdirSync(outDir, { recursive: true })

const CARDS = [
  { slug: 'cursor-fluent', title: 'Cursor Fluent', subtitle: 'IC developer fluency' },
  { slug: 'org-adoption', title: 'From Isolated to Org-Wide', subtitle: 'Adoption for eng leaders' },
  { slug: 'edu-ops', title: 'Education Ops', subtitle: 'Weekly-shipping IDE education' },
  {
    slug: 'fluency-path',
    title: 'Cursor Developer Fluency Program',
    subtitle: 'Certified learning path',
  },
]

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function makeCard({ slug, title, subtitle }, logoBuf) {
  const width = 1200
  const height = 630
  const titleLines = title.length > 28 ? title.split(' ').reduce((lines, word) => {
    const last = lines[lines.length - 1] || ''
    if ((last + ' ' + word).trim().length > 28) lines.push(word)
    else lines[lines.length - 1] = (last + ' ' + word).trim()
    return lines
  }, ['']) : [title]

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="600" y="${400 + i * 48}" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="42" font-weight="600" fill="#f2f2f2">${escapeXml(line)}</text>`,
    )
    .join('')

  const overlay = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="#2a2a2a" stroke-width="2" rx="16"/>
  <text x="600" y="560" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="22" fill="#8a8a8a">${escapeXml(subtitle)}</text>
  ${titleSvg}
</svg>`)

  const logo = await sharp(logoBuf).resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

  const card = await sharp(overlay)
    .composite([{ input: logo, top: 120, left: Math.round((width - 200) / 2) }])
    .png()
    .toBuffer()

  const thumb = await sharp(card).resize(640, 360).png().toBuffer()
  const banner = await sharp(card).resize(1600, 480, { fit: 'cover', position: 'centre' }).png().toBuffer()

  writeFileSync(join(outDir, `${slug}-card.png`), card)
  writeFileSync(join(outDir, `${slug}-thumb.png`), thumb)
  writeFileSync(join(outDir, `${slug}-banner.png`), banner)
  console.log('Wrote cards for', slug)
}

const logoPath = join(brand, 'cursor-logo-3d-dark.png')
const logoBuf = await sharp(logoPath).png().toBuffer()
for (const card of CARDS) {
  await makeCard(card, logoBuf)
}
console.log('Done →', outDir)
