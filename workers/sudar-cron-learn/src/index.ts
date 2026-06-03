/**
 * Cloudflare Cron Worker — invokes Sudar Learn scheduled API routes.
 * Set secrets: CRON_SECRET, LEARN_APP_URL (https://learn.thesudar.com)
 */
export interface Env {
  CRON_SECRET: string;
  LEARN_APP_URL: string;
}

async function invokeCron(env: Env, path: string): Promise<Response> {
  const base = env.LEARN_APP_URL.replace(/\/$/, "");
  const secret = env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  return new Response(
    JSON.stringify({ path, status: res.status, body: body.slice(0, 500) }),
    { status: res.ok ? 200 : 502, headers: { "content-type": "application/json" } }
  );
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const cron = event.cron;
    let path: string | null = null;
    if (cron === "30 4 * * *") {
      path = "/api/cron/consolidate-learner-memory";
    } else if (cron === "*/10 * * * *") {
      path = "/api/cron/process-kb-uploads";
    }
    if (!path) return;
    ctx.waitUntil(invokeCron(env, path));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    if (!path?.startsWith("/api/cron/")) {
      return new Response("Missing or invalid path query param", { status: 400 });
    }
    return invokeCron(env, path);
  },
};
