/**
 * Enum matrix smoke test for reference-bust → compileScene.
 * Run: npx tsx shared/sudarart/verifyReferenceBustCompile.ts (from repo root)
 * or: npm run verify:bust from sudarart/
 */
import { SceneSpecSchema } from "./schema";
import { compileScene } from "./compiler";

const base = {
  archetype: "reference-bust" as const,
  themeColor: "#1a1a1a",
  backgroundColor: "#f2f1d5",
  animation: "none" as const,
  skinTone: "#fec6ad",
  skinShadow: "#febfa4",
  hairColor: "#3d2914",
  jacketColor: "#1a1a1a",
  teeColor: "#ffffff",
  buttonColor: "#0c0c0c",
  eyebrowColor: "#936639",
  pupilColor: "#0abde3",
  teethColor: "#f2f2f2",
  mouthColor: "#6b0908",
  tongueColor: "#ffa0be",
  tongueShadow: "#eb8caa",
  capBrimColor: "#212121",
  capReflectColor: "#121212",
};

const headwears = ["none", "cap"] as const;
const eyewears = ["none", "glasses"] as const;
const mouths = ["open-smile", "closed-smile"] as const;
const tops = ["jacket-tee", "sweater-solid"] as const;

let count = 0;
for (const headwear of headwears) {
  for (const eyewear of eyewears) {
    for (const mouthStyle of mouths) {
      for (const topType of tops) {
        const raw = { ...base, headwear, eyewear, mouthStyle, topType };
        const spec = SceneSpecSchema.parse(raw);
        const { html, css } = compileScene(spec);
        if (!html.includes("rb-man")) throw new Error(`missing rb-man for ${JSON.stringify(raw)}`);
        if (css.length < 500) throw new Error(`css too short for ${JSON.stringify(raw)}`);
        count++;
      }
    }
  }
}

process.stdout.write(`reference-bust compile matrix ok (${count} variants)\n`);
