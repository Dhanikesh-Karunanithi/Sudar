# Sudar Ecosystem Demo

## Product launch (cinematic)

Full-screen video-like experience: title cards, animated typography overlays on wireframes, and a **~5 minute** product story.

- **URL:** [http://localhost:3003](http://localhost:3003) (`npm run demo:ecosystem`)
- **Source:** `src/data/launchDemo.ts`, `src/components/cinematic/CinematicPlayer.tsx`

### Scenes (v2)

| Scene ID | Role |
|----------|------|
| `studio-create-sources` | Document · Idea · Business need · Cohort · Learner context |
| `studio-id-blueprint` | Bloom, objectives, archetypes |
| `studio-live-editor` | Progressive blocks + Adaptive Learning |
| `learn-course-rich` | Watch video (Prison Mike asset), accordion, flipcards |
| `learn-tutor-contextual` | Screen-aware Sudar + typed learner reply |
| `learn-memory-rich` | Memory hero, Twin cards, uncertainty tags |

**Asset:** `public/characters/prison-mike.png` (from repo `assets/sudar logo/PrisonMike.png`).

**Chrome:** Learn = light/purple (`variant="learn"`); Studio = dark navy.

## Interactive how-to tour (help / guides)

Step-by-step wireframe walkthrough with chapters and scrub.

- **URL:** [http://localhost:3003/interactive](http://localhost:3003/interactive)
- **Source:** `src/data/ecosystemDemo.ts`, `src/components/demo/EcosystemDemoPlayer.tsx`

## Run locally

```bash
cd sudar-ecosystem-demo
npm install
npm run dev
```

## Deploy

Vercel project root: `sudar-ecosystem-demo`. Suggested URL: `demo.thesudar.app`.

*Sudar, Learns with you, for you.*
