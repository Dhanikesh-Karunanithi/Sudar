import path from 'node:path'
import { fileURLToPath } from 'node:url'
import createNextIntlPlugin from 'next-intl/plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Windows: `.next/trace` under Desktop/OneDrive often throws EPERM; %TEMP%\sudar-studio-next can also EPERM when
// Defender locks Temp. Use node_modules/.cache (stable relative path for tsconfig; usually fewer locks than Temp).
// npm scripts use scripts/run-next.mjs so NODE_PATH includes this app's node_modules.
// Set NEXT_FORCE_PROJECT_DIST=1 to use the default `.next` folder inside this directory.
const useExternalDistOnWin =
  process.platform === 'win32' && process.env.NEXT_FORCE_PROJECT_DIST !== '1'
const distDirWin = useExternalDistOnWin
  ? path.relative(
      __dirname,
      path.join(__dirname, 'node_modules', '.cache', 'sudar-studio-next')
    )
  : undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  ...(distDirWin ? { distDir: distDirWin } : {}),
  // Monorepo: avoid inferring a parent folder (e.g. stray lockfile outside the repo) as the workspace root
  outputFileTracingRoot: path.join(__dirname),
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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
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

export default withNextIntl(nextConfig);

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
