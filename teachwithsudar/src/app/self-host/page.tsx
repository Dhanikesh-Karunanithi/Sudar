import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { GITHUB_URL, STUDIO_APP_URL, LEARN_APP_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Self-Host at $0",
};

export default function SelfHostPage() {
  return (
    <ProseSection title="Self-Host Sudar at $0">
      <p className="text-lg text-foreground">
        Run Studio and Learn on <strong className="text-foreground">Vercel</strong> (free tier) and Sudar Intelligence
        on <strong className="text-foreground">Railway</strong>, <strong className="text-foreground">Render</strong>, or{" "}
        <strong className="text-foreground">Fly.io</strong> (free tiers available). No server cost for the front ends.
        Paid tiers only if you need always-on or more resources.
      </p>
      <p className="mt-4 text-foreground">
        Live demos: <a href={STUDIO_APP_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Sudar Studio</a>,{" "}
        <a href={LEARN_APP_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Sudar Learn</a>.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Why $0 is possible</h2>
      <p className="mt-2 text-foreground">
        Sudar is open source. Vercel hosts the Next.js apps for free. Railway, Render, and Fly.io offer free tiers
        for the Python Intelligence service. You bring your own Supabase project and AI API keys (usage-based).
        Open-weight models and Edge-TTS keep per-learner cost very low; under $0.02/month in our reference setup.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Prerequisites</h2>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground">
        <li>GitHub repo: <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{GITHUB_URL}</a></li>
        <li>Vercel account (sign in with GitHub)</li>
        <li>Supabase project (same for both Studio and Learn)</li>
        <li>Sudar Intelligence hosted somewhere (Railway / Render / Fly.io) for production</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Step 1: Deploy Sudar Studio</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground">
        <li>Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">vercel.com/new</a> and import the repo <code>Dhanikesh-Karunanithi/Sudar</code>.</li>
        <li>Set <strong>Root Directory</strong> to <code>byteos-studio</code> (monorepo).</li>
        <li>Add environment variables from <code>byteos-studio/.env.example</code>: Supabase keys, <code>NEXTAUTH_URL</code>, <code>NEXTAUTH_SECRET</code>, <code>BYTEOS_INTELLIGENCE_URL</code>, at least one AI key, <code>NEXT_PUBLIC_LEARN_APP_URL</code> (you’ll set this after deploying Learn).</li>
        <li>Deploy. Then set <code>NEXTAUTH_URL</code> to the actual Vercel URL and redeploy if needed.</li>
      </ol>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Step 2: Deploy Sudar Learn</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground">
        <li>Create another Vercel project from the same repo.</li>
        <li>Set <strong>Root Directory</strong> to <code>byteos-learn</code>.</li>
        <li>Add env vars from <code>byteos-learn/.env.example</code>: Supabase, <code>NEXTAUTH_URL</code> (your Learn URL), <code>NEXTAUTH_SECRET</code>, <code>BYTEOS_INTELLIGENCE_URL</code>, <code>NEXT_PUBLIC_APP_URL</code> (same as NEXTAUTH_URL).</li>
        <li>Deploy.</li>
      </ol>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Step 3: Deploy Sudar Intelligence</h2>
      <p className="mt-2 text-foreground">
        Vercel only runs Node.js. The Python FastAPI service in <code>byteos-intelligence/</code> must be hosted
        elsewhere. Recommended: <strong>Railway</strong>.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground">
        <li>Sign up at <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">railway.app</a>. New Project → Deploy from GitHub repo, root <code>byteos-intelligence</code>.</li>
        <li>Build: <code>pip install -r requirements.txt</code>. Start: <code>uvicorn src.api.main:app --host 0.0.0.0 --port $PORT</code>.</li>
        <li>Set variables: <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, at least one of <code>TOGETHER_API_KEY</code> / <code>OPENAI_API_KEY</code> / <code>ANTHROPIC_API_KEY</code>, <code>CORS_ORIGINS</code> (your Studio and Learn URLs), <code>ENVIRONMENT=production</code>.</li>
        <li>Generate a domain in Railway. Copy the URL (e.g. <code>https://sudar-intelligence.up.railway.app</code>).</li>
        <li>In both Vercel projects, set <code>BYTEOS_INTELLIGENCE_URL</code> to that URL and redeploy.</li>
      </ol>
      <p className="mt-4 text-foreground">
        Alternatives: <strong>Render</strong> (New Web Service, root <code>byteos-intelligence</code>, same build/start commands) or <strong>Fly.io</strong> (Docker or <code>fly launch</code> in <code>byteos-intelligence</code>). Free tiers may spin down after inactivity; Railway and Render paid tiers give always-on.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Step 4: Wire URLs</h2>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground">
        <li>In Studio (Vercel): set <code>NEXT_PUBLIC_LEARN_APP_URL</code> to your Learn URL.</li>
        <li>In Learn: ensure <code>NEXTAUTH_URL</code> and <code>NEXT_PUBLIC_APP_URL</code> match the Learn deployment URL.</li>
        <li>Redeploy both if you changed anything.</li>
      </ul>
      <p className="mt-6 text-slate-400">
        Full step-by-step and env reference: <code>docs/VERCEL_DEPLOYMENT.md</code> and <code>docs/INTELLIGENCE_DEPLOYMENT.md</code> in the repo.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/plugins" className="text-accent hover:underline">
          Plugin downloads →
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          GitHub repo →
        </a>
      </div>
    </ProseSection>
  );
}
