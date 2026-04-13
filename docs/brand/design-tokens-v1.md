# Sudar Design Tokens v1

## Token Intent
This file defines brand-level primitives used by product and marketing surfaces. It enforces dual-theme parity (light and dark) with Option A and Manrope + Inter typography.

## Color Tokens

### Brand Core
- `--brand-primary`: `#2F2A8A`
- `--brand-primary-strong`: `#26216F`
- `--brand-secondary`: `#5E5AD7`
- `--brand-accent`: `#FF7A45`
- `--brand-accent-soft`: `#FFD166`

### Neutral (Light)
- `--surface`: `#F7F8FC`
- `--surface-elevated`: `#FFFFFF`
- `--border`: `#D9DCEF`
- `--text-primary`: `#12152B`
- `--text-secondary`: `#4D5275`

### Neutral (Dark)
- `--surface`: `#0D1026`
- `--surface-elevated`: `#161A38`
- `--border`: `#2E3567`
- `--text-primary`: `#F5F7FF`
- `--text-secondary`: `#C1C8F0`

### Semantic
- `--success`: `#1F9D62`
- `--warning`: `#E59A00`
- `--error`: `#D64545`
- `--info`: `#4F7CFF`

## Typography Tokens

### Families
- `--font-heading`: `"Manrope", "Inter", "Segoe UI", Arial, sans-serif`
- `--font-body`: `"Inter", "Segoe UI", Arial, sans-serif`

### Weights
- `--font-weight-regular`: `400`
- `--font-weight-medium`: `500`
- `--font-weight-semibold`: `600`
- `--font-weight-bold`: `700`

### Scale
- `--display-xl`: `64/72`
- `--display-lg`: `56/64`
- `--h1`: `48/56`
- `--h2`: `40/48`
- `--h3`: `32/40`
- `--h4`: `28/36`
- `--h5`: `24/32`
- `--h6`: `20/28`
- `--body-lg`: `18/28`
- `--body-base`: `16/24`
- `--body-sm`: `14/20`
- `--caption`: `12/16`

## Layout Tokens

### Spacing (4/8 Rhythm)
- `--space-1`: `4px`
- `--space-2`: `8px`
- `--space-3`: `12px`
- `--space-4`: `16px`
- `--space-5`: `20px`
- `--space-6`: `24px`
- `--space-8`: `32px`
- `--space-10`: `40px`
- `--space-12`: `48px`
- `--space-16`: `64px`

### Radius
- `--radius-sm`: `8px`
- `--radius-md`: `12px`
- `--radius-lg`: `18px`
- `--radius-xl`: `24px`
- `--radius-pill`: `999px`
- `--radius-chat-panel`: `32px` (`2rem`) — floating Sudar chat panels (Learn + Studio); Tailwind: `rounded-[var(--radius-chat-panel)]` or `rounded-chat-panel` where configured

### Product implementation (CSS variables)
Sudar Learn and Sudar Studio both set semantic colors in `globals.css` using the neutral and brand values above. **Learn** dark mode uses the token “deep night” neutrals (`#0D1026` surface, `#161A38` elevated, `#2E3567` border). **Studio** dark mode intentionally uses a **neutral black** shell (`#000000` background/surface, `#0a0a0a` cards, zinc-style borders) so the creator surface avoids a generic blue-gray cast; brand indigo/orange still come through primary and accent controls only.

### Shadow
- `--shadow-sm`: `0 1px 2px rgba(10, 15, 40, 0.08)`
- `--shadow-md`: `0 6px 16px rgba(10, 15, 40, 0.12)`
- `--shadow-lg`: `0 14px 30px rgba(10, 15, 40, 0.18)`

## Accessibility Guardrails
- Body text contrast target: WCAG AA minimum in both themes.
- Primary text on light surfaces uses `--text-primary`; avoid orange accent for long text.
- On dark surfaces, prefer `--text-primary`; reserve `--brand-accent-soft` for highlights.
- Buttons must maintain AA contrast between label and fill in default and hover states.

