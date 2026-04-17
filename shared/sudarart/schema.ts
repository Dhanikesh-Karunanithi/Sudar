import { z } from "zod";

export const CharacterPortraitSchema = z.object({
  archetype: z.literal("character-portrait"),
  themeColor: z.string(),
  backgroundColor: z.string(),
  animation: z.enum(["none", "breathe", "float", "pulse", "spin"]),
  faceShape: z.enum(["round", "square", "oval", "wide"]),
  skinTone: z.string(),
  eyeStyle: z.enum(["dots", "wide", "half-closed"]),
  noseStyle: z.enum(["small", "wide", "long", "button"]),
  mouthStyle: z.enum(["smile-teeth", "smile-closed", "smirk", "open-tongue", "lips"]),
  hairStyle: z.enum(["short", "long", "curly", "spiky", "bald", "afro", "pigtails", "asymmetrical"]),
  hairColor: z.string(),
  facialHair: z.enum(["none", "beard", "mustache", "goatee", "full-beard"]),
  accessory: z.enum(["none", "glasses", "sunglasses", "earrings", "headband", "laptop", "coffee", "book", "phone", "yoga-mat"]),
  headwear: z.enum(["none", "cap", "beret", "bowler"]),
  details: z.enum(["none", "freckles", "tattoo"]),
});

export const GeometricLandscapeSchema = z.object({
  archetype: z.literal("geometric-landscape"),
  themeColor: z.string(),
  backgroundColor: z.string(),
  animation: z.enum(["none", "breathe", "float", "pulse", "spin"]),
  timeOfDay: z.enum(["day", "night", "sunset", "dawn"]),
  terrainType: z.enum(["mountains", "city", "desert", "ocean"]),
});

export const MultiPortraitGridSchema = z.object({
  archetype: z.literal("multi-portrait-grid"),
  themeColor: z.string(),
  backgroundColor: z.string(),
  animation: z.enum(["none", "breathe", "float", "pulse", "spin"]),
  skinTone: z.string(),
  accentColor: z.string(),
});

export const FullSceneFigureSchema = z.object({
  archetype: z.literal("full-scene-figure"),
  themeColor: z.string(),
  backgroundColor: z.string(),
  animation: z.enum(["none", "breathe", "float", "pulse", "spin"]),
  skinTone: z.string(),
  suitColor: z.string(),
});

/** Waist-up illustration matching reference CSS (nested face + jacket), not modular limbs. */
export const ReferenceBustSchema = z.object({
  archetype: z.literal("reference-bust"),
  themeColor: z.string(),
  backgroundColor: z.string(),
  animation: z.enum(["none", "breathe", "float"]),
  skinTone: z.string(),
  skinShadow: z.string(),
  hairColor: z.string(),
  jacketColor: z.string(),
  teeColor: z.string(),
  buttonColor: z.string(),
  eyebrowColor: z.string(),
  pupilColor: z.string(),
  teethColor: z.string(),
  mouthColor: z.string(),
  tongueColor: z.string(),
  tongueShadow: z.string(),
  capBrimColor: z.string(),
  capReflectColor: z.string(),
  headwear: z.enum(["none", "cap"]),
  eyewear: z.enum(["none", "glasses"]),
  mouthStyle: z.enum(["open-smile", "closed-smile"]),
  topType: z.enum(["jacket-tee", "sweater-solid"]),
});

export const FullFigureCharacterSchema = z.object({
  archetype: z.literal("full-figure-character"),
  themeColor: z.string(),
  backgroundColor: z.string(),
  animation: z.enum(["none", "breathe", "float", "pulse", "spin", "walk", "wave"]),
  pose: z.enum(["standing", "walking", "waving", "sitting", "running"]),
  direction: z.enum(["front", "back", "side-left", "side-right"]),
  /** Visual style preset for the CSS compiler (optional for older specs / cache). */
  figureTheme: z.enum(["rounded", "geometric", "soft", "outline", "pixel"]).optional(),
  skinTone: z.string(),
  hairStyle: z.enum(["short", "long", "bun", "ponytail", "bob"]),
  hairColor: z.string(),
  topStyle: z.enum(["t-shirt", "crop-top", "sweater", "tank-top"]),
  topColor: z.string(),
  bottomStyle: z.enum(["pants", "shorts", "skirt", "wide-pants"]),
  bottomColor: z.string(),
  shoesColor: z.string(),
  accessory: z.enum(["none", "laptop", "coffee", "book", "phone", "yoga-mat"]),
});

export type FullFigureTheme = NonNullable<z.infer<typeof FullFigureCharacterSchema>["figureTheme"]>;

export const SceneSpecSchema = z.discriminatedUnion("archetype", [
  CharacterPortraitSchema,
  ReferenceBustSchema,
  GeometricLandscapeSchema,
  MultiPortraitGridSchema,
  FullSceneFigureSchema,
  FullFigureCharacterSchema,
]);

export type CharacterPortrait = z.infer<typeof CharacterPortraitSchema>;
export type ReferenceBust = z.infer<typeof ReferenceBustSchema>;
export type GeometricLandscape = z.infer<typeof GeometricLandscapeSchema>;
export type MultiPortraitGrid = z.infer<typeof MultiPortraitGridSchema>;
export type FullSceneFigure = z.infer<typeof FullSceneFigureSchema>;
export type FullFigureCharacter = z.infer<typeof FullFigureCharacterSchema>;
export type SceneSpec = z.infer<typeof SceneSpecSchema>;
