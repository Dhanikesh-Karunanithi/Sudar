# ByteVerse — AI-Powered Learning Ecosystem

ByteVerse is the AI learning ecosystem that **learns with you** — powered by [ByteOS](https://github.com/lorddannykay/ByteOS), the open-source Learning Operating System. One seed. Infinite ways to learn.

This repository is the **landing page** for [byteverse.app](https://byteverse.app). The product is built on ByteOS: longitudinal learner memory, adaptive paths, AI tutor (Sudar), and multi-modality (text, flashcards, video, audio, mind maps). Created by **Dhanikesh Karunanithi** — Global Head of Learning Tech & Data Strategy; 2× Gold Stevie (2024), Brandon Hall Gold & Silver (2022).

---

## Features

- Polished hero with tagline "Learns with you, for you" and CTAs to GitHub + waitlist
- Features section: AI tutor with memory, L&D + learners, multimodal, lesson seed, open & research-backed
- Pricing, FAQ, Waitlist (Formspree-ready)
- Accessible, responsive (Vite + Tailwind)
- Deploy on GitHub Pages; GitHub Actions workflow included

---

## Tech

- **React 18** + **Vite**
- **Tailwind CSS 3**
- **ogl** (WebGL) for Gradient Blinds background
- Optional **Formspree** for waitlist

---

## Quickstart

```bash
npm install
cp .env.example .env   # optional: VITE_FORMSPREE_ID, etc.
npm run dev            # http://localhost:5173
npm run build && npm run preview
```

---

## Deploy (GitHub Pages)

1. Push to a **public** repo (e.g. byteverse-app/byteverse).
2. **Settings → Pages → Build and deployment** → Source: **GitHub Actions**.
3. Commit to `main`; the workflow deploys automatically.

For a custom domain (e.g. byteverse.app), set DNS to GitHub Pages and leave `VITE_BASE_PATH` unset unless using a subpath.

---

## Links

- **Product:** [byteverse.app](https://byteverse.app)
- **Platform (open source):** [ByteOS on GitHub](https://github.com/lorddannykay/ByteOS)
- **Creator:** [Dhanikesh Karunanithi](https://dhanikeshkarunanithi.com)

---

*ByteVerse — Learns with you, for you. | Part of the ByteAI/ByteVerse ecosystem.*
