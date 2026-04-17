# Third-party notices

## Uiverse.io — CSS pattern gallery

Sudar course default art includes **CSS adapted** from the community pattern gallery at [uiverse.io/patterns](https://uiverse.io/patterns). The **Galaxy** library (MIT License) mirrors many submissions; see [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy).

**What we ship:** namespaced classes in `sudar-learn/src/app/globals.css` and `sudar-studio/src/app/globals.css` under `.sudar-art-uiverse-*` (generic stripes, rings, crosshatch, beams) and `.sudar-art-uiv-*` (curated gallery picks). Layers are **Sudar-tuned** (palette, opacity, frosted-panel pass, `prefers-reduced-motion`) and are not always byte-for-byte copies of the original component. The course art component renders each pattern **twice**: once full-bleed behind the card, and once inside the frosted panel (`forGlass`) with blend modes so the texture stays visible despite `backdrop-blur`.

**Pattern IDs in product:** see `CourseArtPattern` / `COURSE_ART_PATTERN_IDS` in `courseDefaultArt.ts`. Users can select via `localStorage` key `sudar.courseArt.pattern`.

**License:** MIT (Galaxy / Uiverse ecosystem). Attribution is maintained here.

### Curated Uiverse gallery picks (`uiv_*` IDs)

| Pattern ID | Source (gallery URL) | Notes |
| --- | --- | --- |
| `uiv_breezy_turkey` | [AatreyuShau / breezy-turkey-82](https://uiverse.io/AatreyuShau/breezy-turkey-82) | Original uses SVG filter islands; Sudar uses layered conic/radial gradients + hue drift. |
| `uiv_slimy_gecko` | [stephakayyy / slimy-gecko-94](https://uiverse.io/stephakayyy/slimy-gecko-94) | Dual radial band structure (variation of csemszepp); colors retuned to cyan/violet. |
| `uiv_mean_emu` | [elijahgummer / mean-emu-70](https://uiverse.io/elijahgummer/mean-emu-70) | Matches Galaxy `elijahgummer_mean-emu-70.html` (offset polka grid). |
| `uiv_chilly_moth` | [UserNameSekhar / chilly-moth-71](https://uiverse.io/UserNameSekhar/chilly-moth-71) | Icy grid / frost lines (source not in Galaxy; Sudar-original CSS in family style). |
| `uiv_smart_lizard` | [catraco / smart-lizard-28](https://uiverse.io/catraco/smart-lizard-28) | Cross-hatch / scale mesh (approximation; not in Galaxy). |
| `uiv_plastic_warthog` | [catraco / plastic-warthog-35](https://uiverse.io/catraco/plastic-warthog-35) | Glossy highlight planes (approximation; not in Galaxy). |
| `uiv_clever_puma` | [marsella_3472 / clever-puma-91](https://uiverse.io/marsella_3472/clever-puma-91) | Simplified vertical “rain” vs. the original multi-layer neon city CSS. |
| `uiv_polite_earwig` | [elijahgummer / polite-earwig-72](https://uiverse.io/elijahgummer/polite-earwig-72) | Gallery entry is a **loader**; Sudar uses concentric ring texture + pulse for course art. |
| `uiv_sweet_dolphin` | [SelfMadeSystem / sweet-dolphin-36](https://uiverse.io/SelfMadeSystem/sweet-dolphin-36) | Oceanic wave bands (approximation; not in Galaxy). |
| `uiv_smart_termite` | [SelfMadeSystem / smart-termite-74](https://uiverse.io/SelfMadeSystem/smart-termite-74) | Fine horizontal grain drift (approximation; not in Galaxy). |
| `uiv_wicked_fly` | [SelfMadeSystem / wicked-fly-48](https://uiverse.io/SelfMadeSystem/wicked-fly-48) | Rotating conic facets (approximation; not in Galaxy). |
| `uiv_short_newt` | [SelfMadeSystem / short-newt-53](https://uiverse.io/SelfMadeSystem/short-newt-53) | Soft dual blobs (approximation; not in Galaxy). |
| `uiv_moody_eel` | [Ratinax / moody-eel-40](https://uiverse.io/Ratinax/moody-eel-40) | From Galaxy `Ratinax_moody-eel-40.html`; diagonal + dot, retinted for Sudar. |
| `uiv_dull_mouse` | [rikku94-lab / dull-mouse-6](https://uiverse.io/rikku94-lab/dull-mouse-6) | Speckled matte dot field (approximation; not in Galaxy). |

### Generic Uiverse-inspired layers (non-pick)

| Pattern ID | Role |
| --- | --- |
| `uiverse_stripes` | Diagonal stripe drift |
| `uiverse_rings` | Concentric ring pulse |
| `uiverse_hatch` | Crosshatch drift |
| `uiverse_beams` | Diagonal light beam sweep |
