# Sudar Mascot Illustration Spec (Phase 2)

## Purpose
Guide internal or external illustrators to produce **human-like, expressive 2D** character art that matches Sudar’s brand (premium-minimal, warm-human, light-as-guidance) and drops into the product without layout churn.

## Characters (MVP)
| ID | Name | Role | Accent (pair with icon + label) |
|----|------|------|----------------------------------|
| `sudar` | Sudar | Hero guide | Brand primary / ember accent (light motif) |
| `focus` | Focus | Attention & momentum | Sky / cyan family |
| `memory` | Memory | Recall & recap | Violet family |
| `confidence` | Confidence | Self-efficacy | Emerald family |

Reference tokens: [design-tokens-v1.md](./design-tokens-v1.md) (`--brand-primary`, `--brand-accent`, etc.).

## Art direction
- **Style**: Expressive 2D, soft shapes, limited line weight (not flat corporate clip-art). Readable at **24–48 px** height.
- **Human-like**: Diverse-friendly **abstract human** busts (head + shoulders). Avoid stereotype cues; keep features simple and inclusive.
- **Symbolism**: Sudar may include a subtle **light / glow** element (halo, soft radial, small flame-star nod to logo story) without copying the wordmark.
- **Background**: **Transparent** PNG/WebP or **flat-fill SVG** with no full-bleed rectangle so light/dark themes both work.
- **Mood set (ship order)**  
  1. `neutral` (default)  
  2. `guiding` / `focused` / `prompting` / `supportive` (per character)  
  3. `celebratory`  
  4. `concern` (gentle, never alarming)

## Technical deliverables
- **Primary format**: SVG (prefer single-file per pose) or **@2x PNG** (512×512 artboard, character ~60% height).
- **Naming** (drop into `sudar-learn/public/mascots/`):  
  `{id}-{emotion}.svg` e.g. `sudar-neutral.svg`, `focus-celebratory.svg`
- **Safe area**: Keep face + shoulders inside inner **80%** circle; no critical detail in outer 10%.
- **Accessibility**: Product will always show **name + icon** beside avatars; do not rely on color alone for meaning.

## Integration (engineering)
- Personas live in [sudar-learn/src/lib/mascot/personas.ts](../../sudar-learn/src/lib/mascot/personas.ts); avatars in product today use **`SudarLogoMark`** (same geometry as the app header) via [MascotAvatar.tsx](../../sudar-learn/src/components/mascot/MascotAvatar.tsx).
- When per-character illustrated assets ship, wire poses from `sudar-learn/public/mascots/` into `MascotAvatar` (or persona-driven `src`) without changing the geometry-lock mark in `SudarLogo.tsx`.

## Starter assets
The current files in `sudar-learn/public/mascots/*-neutral.svg` are **placeholder vector busts** for layout and motion tests. Replace them with final illustration exports using the same filenames, or add new emotions and extend the persona map when ready.

## Review checklist (before merge)
- [ ] Reads clearly at 32 px height  
- [ ] Works on light and dark UI (no pure white edge halos unless intentional)  
- [ ] Matches brand warmth; no guilt / shame expressions for “concern”  
- [ ] File size reasonable (< 80 KB per SVG where possible)  
- [ ] Filenames match `{id}-{emotion}` convention  
