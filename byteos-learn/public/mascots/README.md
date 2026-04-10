# Mascot illustrations (Sudar Learn)

Place **final** character exports here so they are served at `/mascots/...`.

## Required for MVP (neutral pose)
- `sudar-neutral.svg`
- `focus-neutral.svg`
- `memory-neutral.svg`
- `confidence-neutral.svg`

## Naming (additional emotions)
`{character-id}-{emotion}.svg` — see `docs/brand/mascot-illustration-spec.md`.

## Updating the app
Set `avatarSrc` on each entry in `src/lib/mascot/personas.ts` if you use different filenames.

The bundled `*-neutral.svg` files are **starter placeholders**; swap them for production art without changing code paths.
