import Link from "next/link";
import { notFound } from "next/navigation";
import { ProseSection } from "@/components/ProseSection";
import { getStoreItem, SUDAR_STORE_ITEMS } from "@/data/sudarStore";
import { GITHUB_URL, STUDIO_APP_URL } from "@/lib/site-nav";

export function generateStaticParams() {
  return SUDAR_STORE_ITEMS.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getStoreItem(id);
  if (!item) return { title: "Not found" };
  return {
    title: `${item.name} — Sudar Store`,
    description: item.tagline,
  };
}

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getStoreItem(id);
  if (!item) notFound();

  return (
    <ProseSection wide label="Sudar Store" title={item.name} subtitle={item.tagline}>
      <p className="text-lg text-foreground">{item.description}</p>

      <div className="not-prose mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">What you get</h2>
          <ul className="mt-4 space-y-2">
            {item.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-foreground-muted">
                <span className="text-brand-orange">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Install options</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            Supported: {item.installTypes.join(", ").replace(/,/g, ", ")}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            LMS: {item.lms.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}
          </p>
          {item.apiEndpoint && (
            <p className="mt-4 rounded-lg border border-white/5 bg-black/30 px-3 py-2 font-mono text-xs text-foreground-muted">
              {item.apiEndpoint}
            </p>
          )}
        </div>
      </div>

      <div className="not-prose mt-10 flex flex-wrap gap-3">
        {item.downloadPath && (
          <a
            href={item.downloadPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            Download / source →
          </a>
        )}
        {item.docsPath && (
          <a
            href={item.docsPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white/5"
          >
            Documentation →
          </a>
        )}
        {item.studioPath && (
          <a
            href={item.studioPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white/5"
          >
            Studio Integrations →
          </a>
        )}
        {item.githubPath && item.githubPath !== item.downloadPath && (
          <a
            href={item.githubPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white/5"
          >
            View on GitHub →
          </a>
        )}
      </div>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/store" className="text-accent hover:underline">
          ← Back to Sudar Store
        </Link>
        <Link href="/alp" className="text-accent hover:underline">
          ALP overview →
        </Link>
        <a href={`${GITHUB_URL}/blob/main/docs/ALP_API.md`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          ALP API →
        </a>
        <a
          href={`${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Create API →
        </a>
      </div>
    </ProseSection>
  );
}
