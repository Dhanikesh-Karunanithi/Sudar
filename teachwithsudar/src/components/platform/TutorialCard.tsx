import Link from "next/link";
import type { Tutorial } from "@/data/tutorials";

const audienceLabel: Record<Tutorial["audience"], string> = {
  admin: "Studio / L&D",
  learner: "Learner",
  operator: "Operator",
};

export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link
      href={`/guides/${tutorial.slug}`}
      className="group block rounded-xl border border-card-border bg-card-bg p-6 shadow-card hover:border-primary/30 hover:shadow-card-hover transition-all h-full flex flex-col"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-[10px] font-mono tracking-widest text-primary/70 uppercase border border-primary/20 rounded-full px-2.5 py-0.5">
          {audienceLabel[tutorial.audience]}
        </span>
        <span className="text-[10px] font-mono text-foreground-muted">{tutorial.duration}</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {tutorial.title}
      </h3>
      <p className="mt-2 text-sm text-foreground-muted leading-relaxed flex-1">{tutorial.excerpt}</p>
      <span className="mt-4 text-sm font-medium text-primary">Open walkthrough →</span>
    </Link>
  );
}
