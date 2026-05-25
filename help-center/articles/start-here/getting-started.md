---
title: Getting started with Sudar
description: First-time setup for organisations using Studio and Learn, high level order of operations before env details.
audience: admin
category: start-here
order: 1
marketing: true
---

## Connect your foundations

Sudar splits work across **Sudar Studio** (authors and admins), **Sudar Learn** (learners), and **Sudar Intelligence** (heavy AI tasks). Studio and Learn share one **Postgres-compatible database** (your cloud tenant, VPC, or managed service) so courses and telemetry stay aligned.

Suggested order:

1. **Identity and database**: Provision Postgres and configure authentication for your learners and admins.
2. **Session/auth for each app**: Configure each Next.js app with database connection and session secrets per your deployment checklist.
3. **AI keys**: In Studio open **Organization → AI & API Keys** and add at least one chat provider (OpenRouter, Together AI, OpenAI, or similar) so generation and authoring work.
4. **Learners**: Set your Learn base URL wherever Studio references it (integrations and embed tooling).
5. **Optional integrations**: ALP keys, LMS events, SSO, embed: see Sudar Help Center **Admins → Integrations overview** or the Integration Guide in the open-source repo (`docs/INTEGRATION_GUIDE.md`).

Secrets and variables belong in your host’s env configuration, not in screenshots or shared Markdown. Sudar Help Center avoids publishing deploy-specific values.
