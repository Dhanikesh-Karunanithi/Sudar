import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Make Money with Sudar",
};

export default function MonetizePage() {
  return (
    <ProseSection title="Make Money with Sudar">
      <p className="text-lg text-foreground">
        Sudar is open source (Apache-2.0). You can use it to build a business: host for others, customize for verticals, or
        extend the platform. Below are high-level ways to monetize — no formal partner program is required; the
        platform is yours to build on.
      </p>
      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Host Sudar for organizations</h3>
          <p className="mt-2 text-foreground">
            Deploy Sudar (Studio + Learn + Intelligence) and offer it as a managed service. You handle hosting,
            upgrades, and support; clients get a dedicated instance or a multi-tenant setup. Charge per organization or
            per learner.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Customize for verticals</h3>
          <p className="mt-2 text-foreground">
            White-label Sudar for a niche: healthcare compliance, retail onboarding, K–12, higher ed. Add
            vertical-specific templates, branding, and integrations. Sell as a tailored product or consulting + platform.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Build on ALP</h3>
          <p className="mt-2 text-foreground">
            Implement ALP connectors for Canvas, Blackboard, or other LMSs. Offer integration-as-a-service or
            one-time implementation fees. The ALP API is public; you can build and sell connector plugins or
            consulting.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Training and certification</h3>
          <p className="mt-2 text-foreground">
            Create courses or certifications that teach others how to use Sudar (Studio, Learn, self-hosting, ALP).
            Sell training or certification programs to L&D teams and implementors.
          </p>
        </div>
      </div>
      <p className="mt-8 text-slate-400">
        We do not take a cut of your revenue. You are responsible for your own terms, support, and compliance. When
        you redistribute or modify the code, the Apache-2.0 licence applies (preserve copyright and licence notice).
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/self-host" className="text-accent hover:underline">
          Self-host at $0 →
        </Link>
        <Link href="/alp" className="text-accent hover:underline">
          ALP & Plugins →
        </Link>
        <Link href="/collaborate" className="text-accent hover:underline">
          Collaborate →
        </Link>
      </div>
    </ProseSection>
  );
}
