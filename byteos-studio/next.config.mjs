/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for SCORM package uploads (default is 4MB)
  experimental: {
    serverActionsBodySizeLimit: '100mb',
  },
  // Avoid bundling pdf-parse/pdfjs-dist so Node loads them natively (fixes Object.defineProperty in webpack)
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
