/**
 * Writes public/sitemap.xml before static export.
 * Variant-aware: teachwithsudar.com vs thesudar.com (NEXT_PUBLIC_SITE_VARIANT).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(appRoot, "..");

const variant = process.env.NEXT_PUBLIC_SITE_VARIANT === "gateway" ? "gateway" : "marketing";
const siteUrl =
  variant === "gateway" ? "https://thesudar.com" : "https://teachwithsudar.com";

const NAV_PATHS = [
  "/",
  "/story",
  "/mission",
  "/research",
  "/papers",
  "/features",
  "/guides",
  "/modalities",
  "/alp",
  "/self-host",
  "/plugins",
  "/monetize",
  "/blog",
  "/updates",
  "/edtech",
  "/best-practices",
  "/help/studio",
  "/help/learn",
  "/faq",
  "/privacy",
  "/terms",
  "/collaborate",
  "/contact",
  "/demo",
  "/roadmap",
  "/compare",
  "/accessibility",
];

const BLOG_SLUGS = [
  "15-minute-course",
  "lnd-without-team",
  "why-learners-drop-off",
  "multimodal-learning-design",
  "ai-tutor-with-memory",
];

const GUIDE_SLUGS = [
  "create-course-from-document",
  "publish-to-learn",
  "learner-modalities-and-tutor",
  "personalization-and-consent",
  "alp-moodle-integration",
  "mcp-chatgpt-studio",
  "notification-sounds-and-engagement",
  "localization-and-memory",
  "compliance-paths",
  "self-host-production",
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function loadMarketingHelpPaths() {
  const manifestPath = path.join(repoRoot, "help-center", "meta", "manifest.json");
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return (manifest.articles ?? [])
    .filter((article) => article.marketing === true)
    .map((article) => `/help/article/${article.slug}`);
}

function uniquePaths(paths) {
  return [...new Set(paths)];
}

function toAbsoluteUrl(pathname) {
  if (pathname === "/") return `${siteUrl}/`;
  return `${siteUrl}${pathname}`;
}

const allPaths = uniquePaths([
  ...NAV_PATHS,
  ...BLOG_SLUGS.map((slug) => `/blog/${slug}`),
  ...GUIDE_SLUGS.map((slug) => `/guides/${slug}`),
  ...loadMarketingHelpPaths(),
]);

const lastModified = new Date().toISOString();
const urlEntries = allPaths
  .map((pathname) => {
    const priority =
      pathname === "/" ? "1.0" : pathname.startsWith("/blog") || pathname.startsWith("/guides") ? "0.8" : "0.7";
    const changeFreq = pathname === "/" ? "weekly" : "monthly";
    return `  <url>
    <loc>${escapeXml(toAbsoluteUrl(pathname))}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const writeToOut = process.argv.includes("--out");
const outPath = writeToOut
  ? path.join(appRoot, "out", "sitemap.xml")
  : path.join(appRoot, "public", "sitemap.xml");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${allPaths.length} URLs to ${outPath} (${siteUrl})`);
