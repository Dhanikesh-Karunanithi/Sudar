# Sudar Product Branding Spec (v1)

## Scope
Applies to:
- `sudar-studio` (Sudar Studio)
- `sudar-learn` (Sudar Learn)
- `sudar-intelligence` (messaging surfaces, docs, and API-facing brand copy)

## Product-Level Brand Roles
- Studio tone: confident, productive, creator-focused.
- Learn tone: supportive, guided, learner-first.
- Intelligence tone: precise, dependable, adaptive.

## Token Application Guidance
- Use `docs/brand/design-tokens-v1.md` as source of truth for color, typography, spacing, and radius.
- Do not define separate ad hoc brand colors in individual apps.
- All new components should map to token names, not raw hex values.

## Core Component Rules

### Buttons
- Primary CTA: `--brand-primary` fill, high-contrast text.
- Secondary CTA: neutral surface + border.
- Accent CTA (rare): `--brand-accent` for milestone moments only.

### Cards and Panels
- Default card: elevated surface + subtle border + medium radius.
- Analytics and insights cards should avoid over-saturated backgrounds.
- Empty states should include a forward action in primary style.

### Navigation
- Global nav text uses `--text-secondary`; active state uses `--text-primary` + subtle primary indicator.
- Avoid high-contrast glow effects in persistent nav.

### Tutor Surfaces (Sudar)
- Tone: concise, friendly, non-judgmental.
- Visual: soft elevation, warm accent only for emphasis, not full panel fills.
- Action chips should use semantic or neutral schemes with clear labels.

## Modality Presentation Consistency (Learn)
- Each modality chip has a stable icon and label.
- Active modality uses primary emphasis with clear contrast.
- Modality visuals should preserve content-first reading and not feel like separate products.

## Light and Dark Theme Parity
- Every component requires both light and dark token mapping.
- New feature work is incomplete without dark-mode review.
- In dark mode, avoid pure black backgrounds for large content areas; use tokenized deep surfaces.

## Accessibility Checklist
- AA contrast for interactive controls and body text.
- Keyboard-visible focus state for all controls.
- Color is never the sole status signal; pair with text or icon.

## Implementation Note
- Prefer shared token exports and utility classes where possible so Studio and Learn remain visually aligned while preserving product-specific tone.

