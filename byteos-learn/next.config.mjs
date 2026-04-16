import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Base path for relative path deployment (e.g., /learn when deployed under same domain)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Base path for relative path deployment
  ...(basePath ? { basePath } : {}),
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/goals', destination: '/progress', permanent: false },
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
