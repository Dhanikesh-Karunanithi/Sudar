/**
 * Edge proxy: staging.learn / staging.studio → Vercel (pilot hosts).
 * Custom domains on this Worker auto-provision Cloudflare DNS when the zone
 * is on the same account (no Zone DNS Edit API token required).
 */
const UPSTREAM_BY_HOST: Record<string, string> = {
  "staging.learn.thesudar.com": "sudar-learn.vercel.app",
  "staging.studio.thesudar.com": "sudar-studio.vercel.app",
};

export default {
  async fetch(request: Request): Promise<Response> {
    const incoming = new URL(request.url);
    const publicHost = incoming.hostname.toLowerCase();
    const upstreamHost = UPSTREAM_BY_HOST[publicHost];
    if (!upstreamHost) {
      return new Response("Unknown staging host", { status: 404 });
    }

    const target = new URL(incoming.pathname + incoming.search, `https://${upstreamHost}`);
    const headers = new Headers(request.headers);
    headers.set("Host", publicHost);
    headers.set("X-Forwarded-Host", publicHost);
    headers.set("X-Forwarded-Proto", "https");
    headers.set("X-Real-IP", request.headers.get("CF-Connecting-IP") ?? "");

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    return fetch(target, init);
  },
};
