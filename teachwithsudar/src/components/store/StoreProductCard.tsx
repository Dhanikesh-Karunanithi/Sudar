import Link from "next/link";
import type { SudarStoreItem } from "@/data/sudarStore";

const STATUS_STYLES: Record<SudarStoreItem["status"], string> = {
  available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pilot: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "coming-soon": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const STATUS_LABEL: Record<SudarStoreItem["status"], string> = {
  available: "Available",
  pilot: "Pilot",
  "coming-soon": "Coming soon",
};

export function StoreProductCard({ item }: { item: SudarStoreItem }) {
  const primaryHref = item.downloadPath ?? item.docsPath ?? item.githubPath ?? "#";
  const primaryLabel = item.downloadPath ? "Get package" : "View docs";

  return (
    <article className="glass-card flex h-full flex-col rounded-2xl border border-white/10 p-6 transition hover:border-brand-orange/30 hover:bg-brand-orange/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {item.badge && (
            <span className="mb-2 inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              {item.badge}
            </span>
          )}
          <h3 className="font-display text-xl font-semibold text-foreground">{item.name}</h3>
          <p className="mt-1 text-sm text-brand-orange">{item.tagline}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLES[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground-muted">{item.description}</p>

      <ul className="mt-4 space-y-1.5">
        {item.features.slice(0, 3).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-foreground-muted">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-orange" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      {item.apiEndpoint && (
        <p className="mt-4 rounded-lg border border-white/5 bg-black/30 px-3 py-2 font-mono text-[11px] text-foreground-muted">
          {item.apiEndpoint}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-brand-orange px-3 py-2 text-xs font-semibold text-black hover:opacity-90"
        >
          {primaryLabel} →
        </a>
        {item.docsPath && item.downloadPath && (
          <a
            href={item.docsPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5"
          >
            API docs →
          </a>
        )}
        {item.studioPath && (
          <a
            href={item.studioPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5"
          >
            Studio setup →
          </a>
        )}
        <Link
          href={`/store/${item.id}`}
          className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium text-accent hover:underline"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
