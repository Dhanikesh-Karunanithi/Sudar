import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { GITHUB_URL, CONTACT_EMAIL } from "@/lib/site-nav";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <ProseSection title="Terms of Service">
      <p className="text-slate-400">Last updated: March 2026.</p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Use of this website</h2>
      <p className="mt-2 text-foreground">
        teachwithsudar.com is provided for information about Sudar and related documentation, research, and
        community. You may use the site for lawful purposes only. We do not guarantee availability or accuracy of
        content.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Sudar software</h2>
      <p className="mt-2 text-foreground">
        Sudar is open-source software licensed under the Apache License 2.0. The repository is available at{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          {GITHUB_URL}
        </a>
        . You may use, copy, modify, and distribute the software in accordance with the Apache-2.0 licence. The licence
        is provided in the repository; it includes disclaimers of warranty and limitation of liability. We do not
        provide warranties or support obligations unless separately agreed.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Third-party services</h2>
      <p className="mt-2 text-foreground">
        If you deploy Sudar, you may use third-party services (e.g. Vercel, Railway, Supabase, AI providers).
        Your use of those services is subject to their terms. We are not responsible for their availability,
        pricing, or data practices.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Contact</h2>
      <p className="mt-2 text-foreground">
        For questions about these terms:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy →
        </Link>
        <Link href="/contact" className="text-accent hover:underline">
          Contact →
        </Link>
      </div>
    </ProseSection>
  );
}
