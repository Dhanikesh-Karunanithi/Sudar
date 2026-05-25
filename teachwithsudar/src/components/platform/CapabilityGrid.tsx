import Link from "next/link";
import {
  capabilitySurfaces,
  platformCapabilities,
  type CapabilitySurface,
  type PlatformCapability,
} from "@/data/platformCapabilities";

function CapabilityCard({ cap }: { cap: PlatformCapability }) {
  return (
    <article className="rounded-xl border border-card-border bg-card-bg p-5 shadow-card hover:border-primary/25 transition-colors h-full flex flex-col">
      <p className="text-[10px] font-mono tracking-widest text-primary/60 uppercase">
        {capabilitySurfaces[cap.surface].label}
      </p>
      <h3 className="mt-2 font-semibold text-foreground">{cap.title}</h3>
      <p className="mt-2 text-sm text-foreground-muted leading-relaxed flex-1">{cap.summary}</p>
      <ul className="mt-4 space-y-1.5">
        {cap.details.map((d) => (
          <li key={d} className="text-xs text-foreground-muted flex gap-2">
            <span className="text-primary/50 mt-0.5">·</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
      {cap.guideSlug ? (
        <Link href={`/guides/${cap.guideSlug}`} className="mt-4 inline-block text-sm text-primary hover:underline font-medium">
          Walkthrough →
        </Link>
      ) : null}
    </article>
  );
}

export function CapabilityGrid({ surface }: { surface?: CapabilitySurface }) {
  const items = surface ? platformCapabilities.filter((c) => c.surface === surface) : platformCapabilities;

  if (surface) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((cap) => (
          <CapabilityCard key={cap.id} cap={cap} />
        ))}
      </div>
    );
  }

  const surfaces: CapabilitySurface[] = ["studio", "learn", "intelligence", "integrations"];

  return (
    <div className="space-y-14">
      {surfaces.map((s) => (
        <section key={s}>
          <h2 className="text-2xl font-semibold text-foreground">{capabilitySurfaces[s].label}</h2>
          <p className="mt-2 text-foreground-muted max-w-2xl">{capabilitySurfaces[s].description}</p>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformCapabilities
              .filter((c) => c.surface === s)
              .map((cap) => (
                <CapabilityCard key={cap.id} cap={cap} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
