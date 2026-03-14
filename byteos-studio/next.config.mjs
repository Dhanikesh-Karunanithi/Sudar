/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for SCORM package uploads (Next.js 15: serverActions is stable)
  serverActions: {
    bodySizeLimit: '100mb',
  },
  // Avoid bundling pdf-parse/pdfjs-dist so Node loads them natively (fixes Object.defineProperty in webpack)
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
