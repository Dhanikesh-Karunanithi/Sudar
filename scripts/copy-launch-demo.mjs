/**
 * Build sudar-ecosystem-demo for /launch-demo on teachwithsudar.com and copy into public/.
 * Run from repo root: node scripts/copy-launch-demo.mjs
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoDir = path.join(root, "sudar-ecosystem-demo");
const outDir = path.join(demoDir, "out");
const targetDir = path.join(root, "teachwithsudar", "public", "launch-demo");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const demoNext = path.join(demoDir, "node_modules", "next");

// CI installs only teachwithsudar deps; without this, the demo build picks up the
// parent Next.js version and can fail prerendering /500 during static export.
if (!existsSync(demoNext)) {
  console.log("Installing sudar-ecosystem-demo dependencies…");
  const install = spawnSync(npmCmd, ["ci"], {
    cwd: demoDir,
    stdio: "inherit",
    shell: true,
  });
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
}

console.log("Building sudar-ecosystem-demo (basePath=/launch-demo)…");
const build = spawnSync(npmCmd, ["run", "build"], {
  cwd: demoDir,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DEMO_BASE_PATH: "/launch-demo",
  },
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

if (!existsSync(outDir)) {
  console.error("Expected output at", outDir);
  process.exit(1);
}

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}
mkdirSync(path.dirname(targetDir), { recursive: true });
cpSync(outDir, targetDir, { recursive: true });

console.log("Copied launch demo to", targetDir);
