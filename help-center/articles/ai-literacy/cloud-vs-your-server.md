---
title: Cloud vs your own server
description: Where the AI runs and who can see prompts at a high level.
audience: admin
category: ai-literacy
order: 2
marketing: true
---

## Cloud (default)

Most teams connect Sudar to a cloud AI service using an API key (see **AI & API Keys**). The Sudar server sends the minimum text needed for each task to that provider.

Your organisation controls which provider and keys are used; Sudar does not show raw keys in the admin UI.

## Private server (optional)

If your policy requires models to stay on your network, you can run an open model (for example Google Gemma via Ollama) on a machine you control.

When enabled in Org settings, Sudar sends chat and generation requests to that address instead of the default cloud path.

Embeddings for course search may still use a separate cloud or local setup—your operator documents that per deployment.
