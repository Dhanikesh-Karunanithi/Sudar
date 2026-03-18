import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <ProseSection title="Contact">
      <p className="text-lg text-foreground">
        For collaboration, support, or press, use email or GitHub.
      </p>
      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">Email</h3>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 block text-foreground hover:underline">
            {CONTACT_EMAIL}
          </a>
          <p className="mt-2 text-sm text-slate-400">
            Pilots, partnerships, technical questions, or general contact.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">GitHub</h3>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="mt-2 block text-foreground hover:underline">
            {GITHUB_URL}
          </a>
          <p className="mt-2 text-sm text-slate-400">
            Bugs, feature requests, pull requests, and community discussion. The repo has ECOSYSTEM.md, docs/ALP_API.md, and more.
          </p>
        </div>
      </div>
      <h3 className="mt-10 text-lg font-semibold text-foreground">Newsletter</h3>
      <p className="mt-2 text-foreground">
        Product updates and blog posts. Newsletter signup will be added when we integrate Resend or similar. Until then, follow the repo on GitHub for releases.
      </p>
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
