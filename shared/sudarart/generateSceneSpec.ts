import type { ZodIssue } from "zod";
import { SceneSpecSchema, type SceneSpec, type FullFigureTheme } from "./schema";

export type SudarArtChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** UI / API preset: maps to a forced archetype so the model matches the compiler. */
export type SudarArtStylePreset =
  | "auto"
  | "bust"
  | "portrait"
  | "full-figure"
  | "landscape"
  | "grid"
  | "scene";

export type GenerateSceneSpecOptions = {
  style?: SudarArtStylePreset;
  /** When set, full-figure specs use this theme (overrides model output). */
  figureTheme?: FullFigureTheme;
};

const STYLE_TO_ARCHETYPE: Record<Exclude<SudarArtStylePreset, "auto">, SceneSpec["archetype"]> = {
  bust: "reference-bust",
  portrait: "character-portrait",
  "full-figure": "full-figure-character",
  landscape: "geometric-landscape",
  grid: "multi-portrait-grid",
  scene: "full-scene-figure",
};

function buildStyleConstraint(style: SudarArtStylePreset | undefined): string {
  if (!style || style === "auto") return "";
  const archetype = STYLE_TO_ARCHETYPE[style];
  let extra = "";
  if (archetype === "full-figure-character") {
    extra = `
For this request you MUST use archetype "full-figure-character" (full-body 2D modular character).
- Map the user's words to pose (standing|walking|waving|sitting|running) and direction (front|back|side-left|side-right).
- Use animation "walk" when pose is walking; "wave" when pose is waving; otherwise prefer "breathe" or "float" (not "none" unless static).
- topStyle/bottomStyle/shoesColor/accessory must match the description; use hex colors for skinTone, hairColor, topColor, bottomColor, shoesColor.
- hairStyle must be one of: short, long, bun, ponytail, bob only.`;
  } else if (archetype === "reference-bust") {
    extra = `
For this request you MUST use archetype "reference-bust" (waist-up high-detail bust only; no legs).
- animation must be one of: none, breathe, float only.
- Fill every required hex field from the prompt; use headwear cap for caps/hats, none for visible hair mass; glasses vs none; mouth open-smile vs closed-smile; jacket-tee vs sweater-solid for top.`;
  } else if (archetype === "character-portrait") {
    extra = `
For this request you MUST use archetype "character-portrait". Fill face, hair, and portrait-level accessory from the prompt.`;
  } else if (archetype === "geometric-landscape") {
    extra = `\nFor this request you MUST use archetype "geometric-landscape". Set timeOfDay and terrainType from the prompt.`;
  } else if (archetype === "multi-portrait-grid") {
    extra = `\nFor this request you MUST use archetype "multi-portrait-grid".`;
  } else if (archetype === "full-scene-figure") {
    extra = `\nFor this request you MUST use archetype "full-scene-figure".`;
  }
  return `\n\nSTYLE LOCK: Output MUST have "archetype": "${archetype}".${extra}`;
}

const ARCHETYPE_RULES = `You output ONE JSON object only (no markdown fences, no commentary). It must validate as exactly one archetype below.

Choose the best archetype for the user's prompt:
- reference-bust: waist-up only, rich face + jacket/sweater (recommended for people when legs/full-body are not required).
- character-portrait: simpler head/shoulders modular avatar.
- full-figure-character: full body with legs/poses; use ONLY when the prompt clearly needs whole-body or walking/sitting/running legs visible.
- geometric-landscape: abstract circular landscape (mountains/city/desert/ocean).
- multi-portrait-grid: three stylized portraits in a grid.
- full-scene-figure: single figure in an environment (moon/stars/ground).

Shared fields (all archetypes): archetype, themeColor, backgroundColor, animation.
animation must be one of: none, breathe, float, pulse, spin — EXCEPT reference-bust allows ONLY none, breathe, float.
For full-figure-character ONLY you may also use: walk, wave (for walking pose use walk with pose walking; for waving use wave with pose waving).

=== reference-bust ===
Required: skinTone, skinShadow, hairColor, jacketColor, teeColor, buttonColor, eyebrowColor, pupilColor, teethColor, mouthColor, tongueColor, tongueShadow, capBrimColor, capReflectColor (all hex strings). themeColor is a general accent hex (may match jacket or eye accent). backgroundColor hex.
headwear: none|cap — cap for baseball-style cap; none shows hair mass instead.
eyewear: none|glasses.
mouthStyle: open-smile|closed-smile.
topType: jacket-tee|sweater-solid — jacket-tee shows contrasting tee; sweater-solid is one-piece top.

=== character-portrait ===
Required: faceShape (round|square|oval|wide), skinTone (hex), eyeStyle (dots|wide|half-closed), noseStyle (small|wide|long|button), mouthStyle (smile-teeth|smile-closed|smirk|open-tongue|lips), hairStyle (short|long|curly|spiky|bald|afro|pigtails|asymmetrical), hairColor (hex), facialHair (none|beard|mustache|goatee|full-beard), accessory (none|glasses|sunglasses|earrings|headband|laptop|coffee|book|phone|yoga-mat), headwear (none|cap|beret|bowler), details (none|freckles|tattoo).

=== full-figure-character ===
NOT character-portrait hair enums. hairStyle MUST be one of: short, long, bun, ponytail, bob ONLY.
Required: pose (standing|walking|waving|sitting|running), direction (front|back|side-left|side-right), skinTone (hex), hairStyle, hairColor (hex), topStyle (t-shirt|crop-top|sweater|tank-top), topColor (hex), bottomStyle (pants|shorts|skirt|wide-pants), bottomColor (hex), shoesColor (hex), accessory (none|laptop|coffee|book|phone|yoga-mat) — no glasses/headwear here.
Optional: figureTheme (rounded|geometric|soft|outline|pixel) — visual style preset; prefer rounded if unsure.

=== geometric-landscape ===
Required: timeOfDay (day|night|sunset|dawn), terrainType (mountains|city|desert|ocean).

=== multi-portrait-grid ===
Required: skinTone (hex), accentColor (hex).

=== full-scene-figure ===
Required: skinTone (hex), suitColor (hex).

STYLE: Use bold distinct hex codes. reference-bust should use a harmonious palette (skin / jacket / cap / mouth) like flat illustration references. character-portrait and full-figure-character: vibrant flat vector-style colors.`;

function buildUserContent(prompt: string, validationHint?: string): string {
  let base = `User prompt: "${prompt.trim()}"\n\nReturn only the JSON object.`;
  if (validationHint) {
    base += `\n\nPrevious output failed validation. Fix it. Errors:\n${validationHint}`;
  }
  return base;
}

function applyFigureThemeOption(spec: SceneSpec, theme: FullFigureTheme | undefined): SceneSpec {
  if (!theme || spec.archetype !== "full-figure-character") return spec;
  return { ...spec, figureTheme: theme };
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (fence) return fence[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function generateSceneSpec(
  prompt: string,
  completeJson: (messages: SudarArtChatMessage[]) => Promise<string>,
  options?: GenerateSceneSpecOptions
): Promise<SceneSpec> {
  if (!prompt.trim()) {
    throw new Error("Prompt is required");
  }

  const styleLock = buildStyleConstraint(options?.style);
  const systemContent = `You are a CSS art specification generator for SudarArt. ${ARCHETYPE_RULES}${styleLock}`;

  const first = await completeJson([
    { role: "system", content: systemContent },
    { role: "user", content: buildUserContent(prompt) },
  ]);

  let raw = extractJsonObject(first);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model returned invalid JSON");
  }

  const firstResult = SceneSpecSchema.safeParse(parsed);
  if (firstResult.success) return applyFigureThemeOption(firstResult.data, options?.figureTheme);

  const hint = firstResult.error.issues.map((i: ZodIssue) => `${i.path.join(".")}: ${i.message}`).join("\n");
  const second = await completeJson([
    { role: "system", content: systemContent },
    { role: "user", content: buildUserContent(prompt, hint) },
  ]);

  raw = extractJsonObject(second);
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model returned invalid JSON on retry");
  }

  const secondResult = SceneSpecSchema.safeParse(parsed);
  if (secondResult.success) return applyFigureThemeOption(secondResult.data, options?.figureTheme);

  throw new Error(
    `Invalid scene spec: ${secondResult.error.issues.map((i: ZodIssue) => i.message).join("; ")}`
  );
}

/** Default export for Node/tsx interop when re-exported through CJS-style module graphs. */
export default { generateSceneSpec };
