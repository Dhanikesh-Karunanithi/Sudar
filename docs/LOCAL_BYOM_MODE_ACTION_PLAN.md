# Sudar Local BYOM Mode — Execution Plan
**Status**: Proposed | **Date**: 2026-05-01  
**Companion spec**: `docs/LOCAL_BYOM_MODE_PRD.md`

---

## 1) Outcome and Scope

Deliver a production-ready Local BYOM runtime path that allows Sudar organizations to connect user-installed local model servers while preserving cloud fallback and policy control.

**Target release shape (v1):**
- Studio runtime policy UI + provider setup wizard.
- Intelligence routing engine with local provider adapter.
- Learn tutor + lightweight generation aware of local/cloud route decisions.
- Observability dashboards and rollout guardrails.

---

## 2) Delivery Phases

## Phase 0 — Architecture and Contracts (Week 1)
**Goal**: Freeze contracts before coding across apps.

- Finalize policy schema in `organisations.settings.ai_runtime`.
- Finalize response metadata (`routing`) for tutor/generation APIs.
- Publish error code catalog and UX mapping.
- Add feature flag: `LOCAL_BYOM_MODE_ENABLED`.

**Acceptance criteria**
- API contract approved by owner.
- JSON schema and Zod/Pydantic validators defined.
- Feature flag gates all new behavior.

---

## Phase 1 — Intelligence Routing Core (Weeks 2-3)
**Goal**: Build policy-aware router and local adapter with tests.

### Workstream 1A: Router foundation (`sudar-intelligence`)
- Add `ModelRouter` abstraction:
  - input: org policy, feature capability, health state
  - output: route decision + reason
- Implement fallback strategy for `cloud`, `local`, `hybrid`.
- Add timeout and retry budget controls.

### Workstream 1B: Provider adapters
- Implement `openai_compatible_local` adapter (Ollama/LM Studio compatible).
- Reuse existing cloud adapters and wrap them in unified interface.
- Add provider health check and model availability probe.

### Workstream 1C: Endpoint integration
- Extend `POST /api/tutor/query` and `POST /api/content/generate` to return `routing` metadata.
- Add `/api/runtime/resolve` endpoint.

**Acceptance criteria**
- Unit tests for routing matrix pass.
- Integration tests cover fallback and strict-local failure behavior.
- Backward compatibility maintained for clients not yet reading `routing`.

---

## Phase 2 — Studio Governance UX (Weeks 3-4)
**Goal**: Allow org admins to configure local providers safely.

### Workstream 2A: Policy APIs (`sudar-studio`)
- `GET /api/org/ai-runtime-policy`
- `PUT /api/org/ai-runtime-policy`
- `POST /api/ai/runtime/providers/test`

### Workstream 2B: UI
- Add section in Governance/Org settings:
  - mode selector
  - strict-local toggle
  - provider cards with health
  - add/edit/delete provider wizard
- Add setup diagnostics panel with actionable messages.

### Workstream 2C: Security
- Ensure token/secret handling remains server-side only.
- Mask secret values on read.

**Acceptance criteria**
- Admin can configure provider in under 5 minutes.
- Failed connectivity test explains next step clearly.
- Policy writes persisted to `organisations.settings`.

---

## Phase 3 — Learn Runtime Experience (Week 4)
**Goal**: Make runtime decisions visible and user-safe.

### Workstream 3A: Tutor UX (`sudar-learn`)
- Show runtime badge (`Local model active`, `Cloud fallback used`).
- Show strict-local unavailable message with guidance.

### Workstream 3B: Feature gating
- Disable unsupported local-only features based on capability map.
- Keep learner flow intact with graceful fallbacks.

### Workstream 3C: Event instrumentation
- Emit `learning_events` for runtime decisions:
  - `ai_runtime_route`
  - `ai_runtime_fallback`
  - `ai_runtime_failure`

**Acceptance criteria**
- Learners understand whether inference is local or cloud.
- No silent failures on strict-local outages.
- Runtime events visible in analytics pipeline.

---

## Phase 4 — Offline-Resilience and Pilot Hardening (Weeks 5-6)
**Goal**: Prove reliability in low-connectivity environments.

### Workstream 4A: Resilience behavior
- Add short-lived request queue for transient local unavailability (where safe).
- Add exponential retry with cap for local route in hybrid mode.

### Workstream 4B: Pilot readiness
- Prepare admin setup guide and troubleshooting playbook.
- Define recommended models by hardware class (8GB/16GB/32GB+ RAM).
- Run pilot with 1-2 organizations.

### Workstream 4C: Operational dashboards
- Build route/fallback/error metrics report for Governance.
- Alert threshold for high fallback rates.

**Acceptance criteria**
- Pilot org can run local mode with <10% unresolved failures.
- Mean provider setup time under 10 minutes.
- Fallback reasons and trends available to admins.

---

## 3) Task Breakdown by Application

### `sudar-intelligence`
- Add `src/runtime/` module:
  - `router.py`
  - `providers/base.py`
  - `providers/openai_local.py`
  - `health.py`
  - `schemas.py`
- Extend tutor and content generation routes with routing metadata.
- Add tests for route matrix and fallback handling.

### `sudar-studio`
- Add runtime policy API routes in `app/api/`.
- Add governance UI panel for Local BYOM configuration.
- Add provider test action with inline diagnostics.

### `sudar-learn`
- Add runtime indicator component in tutor UI.
- Add capability-aware feature gating in generation triggers.
- Capture runtime routing telemetry events.

### Shared / Docs
- Add setup docs for Ollama/LM Studio/local OpenAI-compatible servers.
- Add BYOM license responsibility notice template.

---

## 4) Milestone Gates

| Milestone | Exit Gate |
|---|---|
| M1 Contract freeze | PRD + API schemas approved |
| M2 Router ready | Intelligence tests green; metadata returned |
| M3 Admin setup ready | Studio policy UX usable end-to-end |
| M4 Learner ready | Learn UX + gating + telemetry complete |
| M5 Pilot complete | 1-2 orgs validated, metrics captured |

---

## 5) Risk Register and Fallback Plan

| Risk | Trigger | Fallback |
|---|---|---|
| Local endpoints unstable | frequent timeouts | auto-hybrid with clear audit trail |
| Unsupported models selected | capability check fails | block activation + suggest compatible models |
| Too many support tickets | setup confusion | guided diagnostics + copy/paste ready checks |
| Quality regression | poor local outputs | allow per-feature cloud pinning in hybrid |

---

## 6) Definition of Done (v1)

- Org admin can configure and validate at least one local provider.
- Tutor and lightweight generation work in `local` and `hybrid` modes.
- Strict-local policy behaves correctly with explicit learner/admin messaging.
- Routing and fallback events are observable and queryable.
- Pilot confirms viability in low-connectivity desktop deployments.

---

## 7) Suggested Immediate Next 7 Days

1. Approve `LOCAL_BYOM_MODE_PRD.md` and this execution plan.
2. Freeze policy schema and API payloads.
3. Implement Intelligence `ModelRouter` skeleton and route metadata response.
4. Build provider test endpoint in Studio.
5. Wire minimal tutor runtime badge in Learn behind feature flag.

---

*This plan is optimized for desktop-first BYOM delivery and future mobile extension.*
