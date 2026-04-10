# Sudar Visual System (v1)

## Logo System

### Canonical Mark Story
The Sudar symbol is composed of three assets:
- top pill
- center AI star
- bottom pill

Narrative sequence:
1. Two stacked pills begin as "=" to represent equal access.
2. The pills move in opposite horizontal directions to form an "S", representing unidirectional learning flow.
3. The center AI star ignites as the flame of learning, completing the mark.

Current working assets are maintained in:
- `assets/sudar logo/sudar_static.html`
- `assets/sudar logo/sudar_animated.html`
- `assets/sudar logo/sudar_loop.html`

### Recommended Variants
- Primary lockup: symbol + wordmark on neutral/light surfaces.
- Mono dark: near-black mark on light backgrounds.
- Mono light: white mark on dark backgrounds.
- Icon-only: symbol for app/favicon/avatar contexts.
- Horizontal lockup: symbol left, wordmark right for constrained headers.

### Usage Rules
- Clear space: at least one star-width on all sides.
- Minimum size:
  - icon-only: 20px
  - full lockup: 96px
- On busy media, use a solid or blurred backing plate before placing the mark.
- Do not stretch, rotate, recolor star separately, or alter the relative pill/star geometry.

## Color System (Approved: Option A)

### Core Palette
- Indigo base: `#2F2A8A`
- Indigo support: `#5E5AD7`
- Ember accent: `#FF7A45`
- Warm highlight: `#FFD166`
- Deep night: `#0D1026`
- Soft cloud: `#F7F8FC`

See implementation mapping in `docs/brand/design-tokens-v1.md`.

### Color Behavior
- Use indigo family for trust, product structure, and key surfaces.
- Use ember accents for activation moments (CTA, progress highlights, spark cues).
- Use warm highlight sparingly for emphasis and celebratory feedback.
- Keep large background gradients subtle; avoid neon-heavy treatment.

## Typography System (Approved)
- Heading and brand display: Manrope.
- UI/body copy: Inter.
- Tone target: premium-minimal in hierarchy, warm-human in readability.

## Spacing, Shape, and Motion
- Spacing rhythm uses 4/8 increments.
- Rounded geometry is preferred for cards and controls (`12px` to `24px`).
- Pill geometry should be preserved in hero motifs and major marketing compositions.
- Motion language:
  - smooth directional translation
  - soft glow for AI star moments
  - no aggressive bounce or playful overshoot in enterprise contexts

## Accessibility and Contrast
- Preserve AA contrast in all body text and interactive controls.
- Accent colors should not carry meaning alone; pair with label/icon.
- Dark mode is first-class and equal priority with light mode.

