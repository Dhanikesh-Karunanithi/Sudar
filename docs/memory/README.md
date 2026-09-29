# Sudar project memory

This folder is the long-lived memory for humans and coding agents working on Sudar. It answers "why is it like this?" and "where does X live?" without rereading a year of chats.

| File | Use it when |
|------|-------------|
| [DECISIONS.md](DECISIONS.md) | You're about to change architecture, providers, hosting, or data ownership. Check whether it was already decided. |
| [GLOSSARY.md](GLOSSARY.md) | You meet a Sudar term (Cavi, ALP, claim, NBA, journey, BYOM...). |
| [FEATURE_MAP.md](FEATURE_MAP.md) | You need the routes, tables, flags, env vars, and tests for a feature. |
| [KNOWN_GAPS.md](KNOWN_GAPS.md) | You want to know what is intentionally unfinished or risky before testers see it. |
| [LEARNED_FROM_CHATS.md](LEARNED_FROM_CHATS.md) | You want the owner's preferences and recurring pitfalls mined from past agent chats. |

Always-on agent guardrails live in `.cursor/rules/` (`sharp-edges.mdc`, `sudar-ship-memory.mdc`) with scoped rules for Learn, Studio, Python services, migrations, and content generation.

## Keeping it current
- New architectural decision -> add a dated entry to `DECISIONS.md` in the same PR.
- New feature, route, table, or flag -> update its row in `FEATURE_MAP.md`.
- Closing a gap -> remove it from `KNOWN_GAPS.md` and log the ship in `UPDATES.md`.
- Status truth order stays: `UPDATES.md` Latest -> `docs/SHIPPED_FEATURES.md` -> code -> these files.
