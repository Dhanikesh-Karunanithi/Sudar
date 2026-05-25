import fs from "fs";
import path from "path";
import { splitYamlFrontmatter } from "@/lib/splitYamlFrontmatter";

type Audience = "learner" | "admin" | "both";

export type PublicHelpArticle = {
  slug: string;
  title: string;
  description?: string;
  audience: Audience;
  category: string;
  order: number;
  marketing: boolean;
  bodyMarkdown: string;
};

export type PublicHelpMeta = Omit<PublicHelpArticle, "bodyMarkdown">;

function getHelpCenterRoot(): string {
  const env = process.env.HELP_CENTER_ROOT?.trim();
  if (env) return env;
  return path.join(process.cwd(), "..", "help-center");
}

function articlesRoot(): string {
  return path.join(getHelpCenterRoot(), "articles");
}

function walkMarkdownSlugs(absDir: string, relParts: string[] = []): string[] {
  if (!fs.existsSync(absDir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const full = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdownSlugs(full, [...relParts, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const base = entry.name.replace(/\.md$/i, "");
      out.push([...relParts, base].join("/"));
    }
  }
  return out;
}

function parseAudience(v: unknown): Audience {
  if (v === "learner" || v === "admin" || v === "both") return v;
  return "both";
}

function metaFrom(slug: string, data: Record<string, unknown>): PublicHelpMeta {
  const category = typeof data.category === "string" && data.category.trim() ? data.category.trim() : "start-here";
  const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : slug.replace(/\//g, " · ");
  const description =
    typeof data.description === "string" && data.description.trim() ? data.description.trim() : undefined;
  const audience = parseAudience(data.audience);
  const orderRaw = typeof data.order === "number" ? data.order : Number(data.order);
  const order = Number.isFinite(orderRaw) ? orderRaw : 999;
  const marketing = Boolean(data.marketing === true || data.marketing === "true");
  return { slug, title, description, audience, category, order, marketing };
}

function slugToAbsolutePath(slug: string): string | null {
  const parts = slug.split("/").filter(Boolean);
  if (parts.some((p) => p.includes(".."))) return null;
  return path.join(articlesRoot(), ...parts) + ".md";
}

function audienceMatchesSurfacing(mode: "learner" | "admin", audience: Audience): boolean {
  if (audience === "both") return true;
  return audience === mode;
}

export function loadAllPublicMarketingMetas(mode: "learner" | "admin"): PublicHelpMeta[] {
  const root = articlesRoot();
  if (!fs.existsSync(root)) return [];
  const rows: PublicHelpMeta[] = [];
  for (const slug of walkMarkdownSlugs(root)) {
    const fp = slugToAbsolutePath(slug);
    if (!fp || !fs.existsSync(fp)) continue;
    const { data } = splitYamlFrontmatter(fs.readFileSync(fp, "utf8"));
    const meta = metaFrom(slug, data as Record<string, unknown>);
    if (!meta.marketing || !audienceMatchesSurfacing(mode, meta.audience)) continue;
    rows.push(meta);
  }
  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

export function loadGroupedPublicMarketingMetas(mode: "learner" | "admin") {
  const articles = loadAllPublicMarketingMetas(mode);
  const byCategory = new Map<string, PublicHelpMeta[]>();
  for (const article of articles) {
    const list = byCategory.get(article.category) ?? [];
    list.push(article);
    byCategory.set(article.category, list);
  }

  const categoryOrder = ["start-here", "learners", "admins", "ai-literacy", "trust", "success"];
  const labels: Record<string, string> = {
    "start-here": "Start here",
    learners: "For learners",
    admins: "For admins",
    "ai-literacy": "Understanding AI",
    trust: "Trust & privacy",
    success: "Customer success",
  };

  const ordered = [
    ...categoryOrder.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !categoryOrder.includes(c)).sort(),
  ];

  return ordered.map((category) => ({
    category,
    label: labels[category] ?? category,
    articles: (byCategory.get(category) ?? []).sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title)
    ),
  }));
}

export function getPublicMarketingArticle(slug: string[]): PublicHelpArticle | null {
  if (slug.some((s) => s.includes(".."))) return null;
  const key = slug.join("/");
  const fp = slugToAbsolutePath(key);
  if (!fp || !fs.existsSync(fp)) return null;
  const raw = fs.readFileSync(fp, "utf8");
  const { data, content } = splitYamlFrontmatter(raw);
  const meta = metaFrom(key, data as Record<string, unknown>);
  if (!meta.marketing) return null;
  return {
    ...meta,
    bodyMarkdown: content.trim(),
  };
}

export function slugParamsForMarketingArticles(): { slug: string[] }[] {
  const root = articlesRoot();
  if (!fs.existsSync(root)) return [];
  const out: { slug: string[] }[] = [];
  for (const slug of walkMarkdownSlugs(root)) {
    const fp = slugToAbsolutePath(slug);
    if (!fp || !fs.existsSync(fp)) continue;
    const { data } = splitYamlFrontmatter(fs.readFileSync(fp, "utf8"));
    const meta = metaFrom(slug, data as Record<string, unknown>);
    if (!meta.marketing) continue;
    out.push({ slug: slug.split("/").filter(Boolean) });
  }
  return out;
}
