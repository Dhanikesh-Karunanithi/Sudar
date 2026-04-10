import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Windows: writing `.next/trace` under the repo (Desktop/OneDrive/Defender) often throws EPERM and kills `next dev`.
// Put the entire dist output in %TEMP% instead (path relative to this app). npm scripts use scripts/run-next.mjs
// so NODE_PATH includes this app's node_modules (otherwise `require("next/dist/...")` from Temp fails).
// Set NEXT_FORCE_PROJECT_DIST=1 to use the default `.next` folder inside this directory.
const useTempDistOnWin =
  process.platform === 'win32' && process.env.NEXT_FORCE_PROJECT_DIST !== '1'
const distDirWin = useTempDistOnWin
  ? path.relative(__dirname, path.join(os.tmpdir(), 'byteos-studio-next'))
  : undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(distDirWin ? { distDir: distDirWin } : {}),
  // Monorepo: avoid inferring a parent folder (e.g. stray lockfile outside the repo) as the workspace root
  outputFileTracingRoot: path.join(__dirname, '..'),
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // Avoid bundling pdf-parse/pdfjs-dist so Node loads them natively (fixes Object.defineProperty in webpack)
  serverExternalPackages: ['pdf-parse'],
  async redirects() {
    return [
      { source: '/learning-paths', destination: '/paths', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.together.xyz https://api.openai.com https://api.anthropic.com",
              "img-src 'self' data: https: blob:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
