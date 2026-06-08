import { blogPosts } from "@/data/blogPosts";
import { tutorials } from "@/data/tutorials";
import { slugParamsForMarketingArticles } from "@/lib/helpCenterPublic";
import { allNavLinks } from "@/lib/site-nav";
import { SITE_URL } from "@/lib/site-variant";

export const dynamic = "force-static";

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map((p) => (p.startsWith("/") ? p : `/${p}`)))];
}

function collectPaths(): string[] {
  const staticPaths = uniquePaths([
    "/",
    ...allNavLinks.map((link) => link.href),
    "/help/learn",
    "/help/studio",
  ]);

  const blogPaths = Object.keys(blogPosts).map((slug) => `/blog/${slug}`);
  const guidePaths = tutorials.map((tutorial) => `/guides/${tutorial.slug}`);
  const helpPaths = slugParamsForMarketingArticles().map(
    (params) => `/help/article/${params.slug.join("/")}`
  );

  return uniquePaths([...staticPaths, ...blogPaths, ...guidePaths, ...helpPaths]);
}

function toAbsoluteUrl(path: string): string {
  if (path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(): string {
  const lastModified = new Date().toISOString();
  const urls = collectPaths()
    .map((path) => {
      const priority =
        path === "/" ? "1.0" : path.startsWith("/blog") || path.startsWith("/guides") ? "0.8" : "0.7";
      const changeFreq = path === "/" ? "weekly" : "monthly";
      return `  <url>
    <loc>${escapeXml(toAbsoluteUrl(path))}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export async function GET() {
  return new Response(buildSitemapXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
