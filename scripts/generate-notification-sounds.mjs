/**
 * Generates short UI chime WAV files for Learn/Studio notification sounds.
 * Run: node scripts/generate-notification-sounds.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SAMPLE_RATE = 22050

function writeWav(filePath, samples) {
  const numChannels = 1
  const bitsPerSample = 16
  const blockAlign = (numChannels * bitsPerSample) / 8
  const byteRate = SAMPLE_RATE * blockAlign
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767 * 0.35), 44 + i * 2)
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, buffer)
}

function tone(freq, durationSec, startSec = 0, totalSec) {
  const len = Math.floor(totalSec * SAMPLE_RATE)
  const out = new Float64Array(len)
  const start = Math.floor(startSec * SAMPLE_RATE)
  const dur = Math.floor(durationSec * SAMPLE_RATE)
  for (let i = 0; i < dur; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.sin((Math.PI * i) / dur)
    const idx = start + i
    if (idx < len) out[idx] += Math.sin(2 * Math.PI * freq * t) * env
  }
  return out
}

function mix(...arrays) {
  const len = Math.max(...arrays.map((a) => a.length))
  const out = new Float64Array(len)
  for (const arr of arrays) {
    for (let i = 0; i < arr.length; i++) out[i] += arr[i]
  }
  return out
}

const sounds = {
  'task-complete.wav': () => mix(tone(523.25, 0.12, 0, 0.35), tone(659.25, 0.14, 0.14, 0.35)),
  'reply.wav': () => tone(880, 0.08, 0, 0.12),
  'notify.wav': () => tone(740, 0.18, 0, 0.22),
  'celebration.wav': () =>
    mix(tone(523.25, 0.1, 0, 0.4), tone(659.25, 0.1, 0.1, 0.4), tone(783.99, 0.12, 0.2, 0.4)),
}

const targets = [
  path.join(root, 'sudar-learn', 'public', 'audio', 'notifications'),
  path.join(root, 'sudar-studio', 'public', 'audio', 'notifications'),
]

for (const dir of targets) {
  for (const [name, build] of Object.entries(sounds)) {
    writeWav(path.join(dir, name), build())
    console.log('wrote', path.join(dir, name))
  }
}
