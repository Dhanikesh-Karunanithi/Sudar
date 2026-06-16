import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Contact",
  description: "Email, GitHub, and collaboration paths for Sudar pilots and partnerships.",
};

export default function ContactPage() {
  return (
    <ProseSection title="Contact">
      <p className="text-lg text-foreground">
        For pilots, partnerships, press, or technical questions—reach us directly. Product updates
        ship in the repo: watch{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          GitHub releases
        </a>{" "}
        and read{" "}
        <Link href="/updates" className="text-primary hover:underline">
          Updates
        </Link>
        .
      </p>
      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Email</h3>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 block text-foreground hover:underline">
            {CONTACT_EMAIL}
          </a>
          <p className="mt-2 text-sm text-slate-400">
            Pilots, partnerships, technical questions, or press. We reply within a few business days.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">GitHub</h3>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-foreground hover:underline"
          >
            {GITHUB_URL}
          </a>
          <p className="mt-2 text-sm text-slate-400">
            Bugs, feature requests, pull requests, and community discussion. Start with ECOSYSTEM.md
            and docs/SHIPPED_FEATURES.md.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Stay current</h3>
          <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
            <li>
              <Link href="/updates" className="text-primary hover:underline">
                Product changelog
              </Link>{" "}
              — what shipped and when
            </li>
            <li>
              <Link href="/blog" className="text-primary hover:underline">
                Blog
              </Link>{" "}
              — L&D and adaptive learning essays
            </li>
            <li>
              <a
                href={`${GITHUB_URL}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub releases
              </a>{" "}
              — tagged builds and release notes
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/collaborate" className="text-accent hover:underline">
          Call for collaboration →
        </Link>
        <Link href="/faq" className="text-accent hover:underline">
          FAQ →
        </Link>
      </div>
    </ProseSection>
  );
}
