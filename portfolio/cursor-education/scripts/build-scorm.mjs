#!/usr/bin/env node
/**
 * Build SCORM 1.2 ZIPs for Cursor Education Portfolio courses.
 *
 * Usage: node portfolio/cursor-education/scripts/build-scorm.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const AdmZip = require(join(process.cwd(), 'sudar-studio/node_modules/adm-zip'))

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const shared = join(root, 'shared')

const COURSES = [
  {
    dir: 'course-1-fluent',
    zipName: 'cursor-fluent-scorm12.zip',
    identifier: 'cursor_fluent_sco',
  },
  {
    dir: 'course-2-org-adoption',
    zipName: 'org-adoption-scorm12.zip',
    identifier: 'org_adoption_sco',
  },
  {
    dir: 'course-3-edu-ops',
    zipName: 'edu-ops-scorm12.zip',
    identifier: 'edu_ops_sco',
  },
]

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildManifest(title, identifier) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escXml(identifier)}_manifest" version="1.1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${escXml(identifier)}_org">
    <organization identifier="${escXml(identifier)}_org">
      <title>${escXml(title)}</title>
      <item identifier="${escXml(identifier)}_item" identifierref="${escXml(identifier)}_res">
        <title>${escXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${escXml(identifier)}_res" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="assets/shell.css"/>
      <file href="assets/shell.js"/>
      <file href="assets/course-config.js"/>
      <file href="assets/cursor-logo.png"/>
      <file href="course.json"/>
    </resource>
  </resources>
</manifest>
`
}

function buildCourse(course) {
  const courseDir = join(root, course.dir)
  const courseJsonPath = join(courseDir, 'course.json')
  if (!existsSync(courseJsonPath)) throw new Error('Missing ' + courseJsonPath)

  const config = JSON.parse(readFileSync(courseJsonPath, 'utf8'))
  const staging = join(dist, '_staging', course.dir)
  mkdirSync(join(staging, 'assets'), { recursive: true })

  writeFileSync(join(staging, 'imsmanifest.xml'), buildManifest(config.title, course.identifier), 'utf8')
  writeFileSync(join(staging, 'course.json'), JSON.stringify(config), 'utf8')
  writeFileSync(
    join(staging, 'assets/course-config.js'),
    'window.COURSE_CONFIG = ' + JSON.stringify(config) + ';\n',
    'utf8',
  )
  cpSync(join(shared, 'index.html'), join(staging, 'index.html'))
  cpSync(join(shared, 'shell.css'), join(staging, 'assets/shell.css'))
  cpSync(join(shared, 'shell.js'), join(staging, 'assets/shell.js'))
  const logoSrc = join(shared, 'assets', 'cursor-logo.png')
  if (existsSync(logoSrc)) cpSync(logoSrc, join(staging, 'assets/cursor-logo.png'))

  const zip = new AdmZip()
  zip.addLocalFolder(staging)
  const outPath = join(dist, course.zipName)
  zip.writeZip(outPath)
  console.log('Built', outPath)
  return outPath
}

mkdirSync(dist, { recursive: true })
for (const c of COURSES) buildCourse(c)
console.log('Done. Upload with: node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/upload-to-sudar.mjs')
