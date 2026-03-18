import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Demo",
};

export default function DemoPage() {
  return (
    <ProseSection title="See Sudar in Action">
      <p className="text-lg text-foreground">
        A short demo video will show Sudar&apos;s longitudinal memory and adaptive behaviour. Once recorded, it will
        be linked here and in the repository (<code>docs/demo.md</code>).
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Planned demo (1–2 minutes)</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>
          <strong className="text-foreground">Sudar remembers:</strong> Sudar referring to something the learner
          struggled with in a previous session (e.g. &quot;Last time you found X tricky; here&apos;s another way to look
          at it&quot;).
        </li>
        <li>
          <strong className="text-foreground">My Memory:</strong> The learner&apos;s &quot;My Memory&quot; page where
          they see what Sudar knows (known concepts, struggles, preferences).
        </li>
        <li>
          <strong className="text-foreground">Optional:</strong> Quick tour of the learner dashboard (streak, next
          best action, course viewer with Sudar sidebar).
        </li>
      </ul>
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-slate-400">Demo video: (Add your link here once recorded.)</p>
        <p className="mt-2 text-sm text-slate-500">
          Record with Loom, OBS, or built-in OS recorder; upload to YouTube (unlisted), Vimeo, or GitHub release
          asset; then add the link to this page and <code>docs/demo.md</code>.
        </p>
      </div>
      <p className="mt-6 text-slate-400">
        Screenshots and a README link are planned in <code>docs/screenshots</code>; see the repo for the latest.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/features" className="text-accent hover:underline">
          Features →
        </Link>
        <Link href="/research" className="text-accent hover:underline">
          Research →
        </Link>
      </div>
    </ProseSection>
  );
}
