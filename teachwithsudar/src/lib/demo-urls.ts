/** Public demo paths on teachwithsudar.com (static export from sudar-ecosystem-demo). */

export const LAUNCH_DEMO_PATH = "/launch-demo";
export const INTERACTIVE_DEMO_PATH = "/launch-demo/interactive";

/** Legacy external host; prefer same-origin paths above. */
export const EXTERNAL_LAUNCH_DEMO_URL =
  process.env.NEXT_PUBLIC_ECOSYSTEM_DEMO_URL?.replace(/\/$/, "") ||
  "https://demo.thesudar.com";

export function launchDemoHref(origin = ""): string {
  return `${origin}${LAUNCH_DEMO_PATH}`;
}

export function interactiveDemoHref(origin = ""): string {
  return `${origin}${INTERACTIVE_DEMO_PATH}`;
}
