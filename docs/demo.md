# Sudar Demo

## Product launch demo (cinematic)

Full-screen **video-like** experience for launching Sudar to the world: title cards, animated typography overlays on wireframes, and a **~5 minute** narrative (Sarah → Somehow I manage → personalization → Marcus → contextual tutor).

- **App**: [`sudar-ecosystem-demo/`](../sudar-ecosystem-demo/)
- **Run locally**: `npm run demo:ecosystem` (port **3003**)
- **Controls**: Play / Pause + sound on/off (auto-hide); Space toggles playback
- **Motion**: Triboo-style reference — static camera, vertical scroll and accordion UI motion, sharp legible text (no chaotic 3D pan)
- **Audio**: Frame-synced whoosh, click, success, and title cues via Web Audio (enable sound on first play if the browser blocks autoplay)
- **Marketing link**: [teachwithsudar.com/demo](https://teachwithsudar.com/demo) — embeds and links to [teachwithsudar.com/launch-demo](https://teachwithsudar.com/launch-demo) (built into the static site on deploy)

### Launch story beats (v2)

1. **Problem / vision** — training is broken; Sudar as Learning OS.
2. **Content generation** — document, **idea** (Office management / Michael Scott tone), **business need**, cohort, learner context.
3. **Instructional design** — Bloom level, objectives, archetypes; live block build (text, video, audio, accordion, flipcard, quiz).
4. **Personalization** — cohort path + individual Memory context.
5. **Learner** — Watch video, pause when stuck, accordion/flipcards, **Sudar asks about what's on screen**, Marcus types a reply.
6. **Twin & ops** — Memory, certification, ALP/MCP, close.

Asset: `sudar-ecosystem-demo/public/characters/prison-mike.png` (course video preview).

## Interactive how-to tour (help / guides)

Step-by-step wireframe walkthrough with chapters and scrub — for teachwithsudar guides and internal how-tos.

- **URL**: `http://localhost:3003/interactive` (same app, different route)
- **Controls**: Autoplay, pause, scrub, chapter jump, speed
- **Chapters**: Content generation, Live editor blocks, Personalization, Learner experience, Tutor Sudar, plus integrations and ops

---

## Recorded demo video (1–2 minutes)

Optional short video for README, pitches, or social. You can **screen-record the cinematic launch** on autoplay, or capture live Studio/Learn.

### Suggested script

- **Generation sources**: Idea + business need, not only PDF.
- **Rich course**: Video, audio, accordion, flipcards in the editor wireframe.
- **Sudar remembers**: Contextual tutor on the lesson screen; learner typed reply.
- **My Memory**: Uncertainty tags and Digital Learner Twin cards.

### How to publish

1. Record with Loom, OBS, or built-in OS recorder.
2. Upload to a public URL (YouTube unlisted, Vimeo, or GitHub release asset).
3. Add the link below and on teachwithsudar `/demo`.

**Demo video:** *(Add your link here once recorded.)*

See also [docs/screenshots/DEMO_VIDEO.md](screenshots/DEMO_VIDEO.md).

---

*Sudar — Learns with you, for you.*
