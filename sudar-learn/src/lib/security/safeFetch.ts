/**
 * SSRF-hardened fetch for optional future tutor URL fetches. Keep in sync with sudar-studio copy.
 * See docs/trust/THREAT_MODEL.md.
 */
import { lookup } from 'dns/promises'
import { isIP } from 'net'

type SafeFetchTextOptions = {
  headers?: HeadersInit
  maxBytes?: number
  timeoutMs?: number
  allowedHosts?: string[]
}

const DEFAULT_MAX_BYTES = 1_000_000
const DEFAULT_TIMEOUT_MS = 10_000

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true
  }

  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 0
  )
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase()
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  )
}

function isBlockedAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) return isPrivateIPv4(address)
  if (family === 6) return isPrivateIPv6(address)
  return true
}

async function assertPublicHost(url: URL, allowedHosts?: string[]) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http and https URLs are supported')
  }

  const hostname = url.hostname.toLowerCase()
  if (allowedHosts?.length && !allowedHosts.map((host) => host.toLowerCase()).includes(hostname)) {
    throw new Error('URL host is not allowed')
  }

  if (isIP(hostname) && isBlockedAddress(hostname)) {
    throw new Error('Private or local network URLs are not allowed')
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error('URL resolves to a private or local network address')
  }
}

function allowedHostsFromEnv(): string[] | undefined {
  const raw = process.env.DOCUMENT_URL_HOST_ALLOWLIST?.trim()
  if (!raw) return undefined
  return raw.split(',').map((host) => host.trim()).filter(Boolean)
}

export async function safeFetchText(input: string, options: SafeFetchTextOptions = {}): Promise<string> {
  const url = new URL(input)
  await assertPublicHost(url, options.allowedHosts ?? allowedHostsFromEnv())

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: options.headers,
      redirect: 'error',
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`)

    const contentLength = Number(response.headers.get('content-length') ?? '0')
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
    if (contentLength > maxBytes) {
      throw new Error('URL response is too large')
    }

    const body = response.body
    if (!body) return ''

    const reader = body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        throw new Error('URL response is too large')
      }
      chunks.push(value)
    }

    return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks))
  } finally {
    clearTimeout(timeout)
  }
}
