/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
