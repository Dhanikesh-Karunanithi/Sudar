"use client";

import { useMemo, useState } from "react";
import {
  SUDAR_STORE_ITEMS,
  STORE_CATEGORIES,
  STORE_LMS_FILTERS,
  type StoreCategory,
  type StoreLms,
} from "@/data/sudarStore";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { ResponsiveCardGrid } from "@/components/ui/ResponsiveCardGrid";

export function StoreCatalog() {
  const [category, setCategory] = useState<StoreCategory | "all">("all");
  const [lms, setLms] = useState<StoreLms | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUDAR_STORE_ITEMS.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (lms !== "all" && !item.lms.includes(lms)) return false;
      if (!q) return true;
      const haystack = [item.name, item.tagline, item.description, ...item.features].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [category, lms, query]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STORE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === c.id
                  ? "border-brand-orange bg-brand-orange/15 text-brand-orange"
                  : "border-white/10 text-foreground-muted hover:border-white/20 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="block w-full max-w-xs">
          <span className="sr-only">Search store</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-orange/50 focus:outline-none"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STORE_LMS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setLms(f.id)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
              lms === f.id
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-white/5 text-foreground-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mb-6 text-sm text-foreground-muted">
        {filtered.length} service{filtered.length === 1 ? "" : "s"} — download packages, use LTI, or call APIs with your org key from Sudar Studio.
      </p>

      {filtered.length > 0 ? (
        <ResponsiveCardGrid
          gridClassName="gap-6 sm:grid-cols-2 xl:grid-cols-3"
          ariaLabel="Store products"
        >
          {filtered.map((item) => (
            <StoreProductCard key={item.id} item={item} />
          ))}
        </ResponsiveCardGrid>
      ) : null}

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-foreground-muted">
          No services match your filters. Try &quot;All&quot; or search for quiz, tutor, or Moodle.
        </p>
      )}
    </div>
  );
}
