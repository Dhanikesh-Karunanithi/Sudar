# Sudar Pet Sprite Assets

Drop production sprite files in this folder.

## Required files

- `sudar-fire-core-sheet.png` (or `.webp`) - full sprite sheet
- `sudar-fire-core-manifest.json` - metadata used by the renderer

## Sprite sheet contract

- Uniform frame size for every row.
- Transparent background.
- Row order:
  - row 0: `idle` (6 frames)
  - row 1: `run_right` (8 frames)
  - row 2: `run_left` (8 frames)
  - row 3: `waving` (4 frames)
  - row 4: `jumping` (5 frames)
  - row 5: `failed` (8 frames)
  - row 6: `waiting` (6 frames)
  - row 7: `running` (6 frames)
  - row 8: `review` (6 frames)

## Export checklist (Aseprite)

- Use nearest-neighbor scaling for pixel clarity.
- Keep a consistent character anchor (bottom center) across frames.
- Export in row-major order with no trimming per frame.
- Keep at least 2px transparent padding around each frame.
- Update `sudar-fire-core-manifest.json` width/height/fps after export.

## Temporary placeholder

If production art is not ready yet, renderer falls back to `sudar-fire-core-placeholder.svg`.
