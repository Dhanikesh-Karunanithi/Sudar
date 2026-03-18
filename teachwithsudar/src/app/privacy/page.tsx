import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site-nav";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <ProseSection title="Privacy Policy">
      <p className="text-slate-400">Last updated: March 2026.</p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Scope</h2>
      <p className="mt-2 text-foreground">
        This policy describes how data is handled when you use Sudar (the software) or the teachwithsudar.com
        website. When you self-host Sudar, data is stored in your own Supabase project; you are the data controller.
        When you use a Sudar instance operated by a third party (e.g. an employer or institution), their privacy
        policy applies.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Data collected by Sudar (when you deploy it)</h2>
      <p className="mt-2 text-foreground">
        Sudar stores data in Supabase (or the database you configure). This includes: learner profiles (Digital
        Learner Twin: goals, struggles, preferences, interaction summary); learning_events (module starts/completions,
        quiz attempts, modality switches, tutor usage); ai_interactions (user messages and AI responses for
        context); enrollments (paths, courses, progress, due dates); and course content. Auth is handled by Supabase
        Auth; credentials are not stored in plain text.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Tenancy and retention</h2>
      <p className="mt-2 text-foreground">
        Data are scoped by tenant (organisation). There is no cross-tenant access. Retention is configurable at
        deployment; the reference implementation does not impose automatic deletion. Deployers should set policies
        (e.g. event logs 12 months, AI transcripts 24 months) in line with local regulation (e.g. GDPR, FERPA).
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Learner rights</h2>
      <p className="mt-2 text-foreground">
        Learners can view their Digital Learner Twin (e.g. &quot;Your context&quot; / My Memory in Learn) and
        correct preferences (voice, response style, modality affinity). Correction of inferred signals (e.g. struggle
        flags) may be offered in future versions. Opt-out of AI tutor memory is supported: disabling memory prevents
        new context from being written to the Twin and limits the tutor to session-only context.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">FERPA and GDPR</h2>
      <p className="mt-2 text-foreground">
        For FERPA (US) and GDPR (EU/UK), the platform stores learner data under the control of the deploying
        institution or organisation. They are responsible for lawful basis, retention, and responding to access or
        deletion requests. Sudar does not sell learner data; when you self-host, your Supabase project is the only
        store.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">teachwithsudar.com</h2>
      <p className="mt-2 text-foreground">
        This website is static marketing and documentation. If you use a contact form or newsletter signup, we
        collect only what you submit (e.g. email, message) to respond or send updates. We do not track you across
        other sites for advertising.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Contact</h2>
      <p className="mt-2 text-foreground">
        For privacy requests or questions about this policy, contact{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service →
        </Link>
        <Link href="/contact" className="text-accent hover:underline">
          Contact →
        </Link>
      </div>
    </ProseSection>
  );
}
