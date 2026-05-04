# Sudar Local BYOM Pilot Runbook

This runbook operationalizes Phase 4 (pilot + hardening) for Local BYOM mode.

## Pilot Objective
- Validate that local inference remains usable in low-connectivity desktop environments.
- Measure fallback/failure behavior before general availability.

## Prerequisites
- Org runtime policy configured in Studio settings.
- At least one active local provider with a successful connection test.
- Tutor, flashcards, and mindmap flows enabled for pilot users.

## KPI Targets (7-day pilot)
- `ai_runtime_route` >= 100 events.
- `ai_runtime_fallback / ai_runtime_route` <= 0.20.
- `ai_runtime_failure` <= 0.10 * `ai_runtime_route`.
- Median provider connection test latency <= 1500ms on LAN.

## Data Sources
- `GET /api/org/ai-runtime-metrics` (Studio): route/fallback/failure counts (7-day window).
- `learning_events` in Supabase:
  - `ai_runtime_route`
  - `ai_runtime_fallback`
  - `ai_runtime_failure`

## Daily Pilot Checks
1. Confirm provider status from Studio runtime section.
2. Run one test connection from Studio.
3. Verify fallback ratio trend is stable or decreasing.
4. Review any strict-local failures and capture root cause:
   - provider offline
   - model missing
   - capability mismatch
5. Sample learner sessions:
   - tutor query in Learn
   - flashcards generation
   - mindmap generation

## Hardening Actions
- If fallback ratio > 20%:
  - Increase local endpoint timeout from 30s to 45s.
  - Verify model availability and RAM fit.
  - Confirm LAN/firewall reliability.
- If strict-local failures spike:
  - Temporarily switch pilot org to `hybrid` mode.
  - Re-enable strict local once failures are resolved.
- If capability mismatches occur:
  - Update provider capabilities in org policy.
  - Surface unsupported features in onboarding notes.

## GA Readiness Checklist
- [ ] Pilot KPIs met for 7 consecutive days.
- [ ] No unresolved strict-local outages.
- [ ] Setup flow validated by at least 2 admins.
- [ ] BYOM license responsibility notice reviewed with pilot orgs.
- [ ] Support playbook documented for common local runtime failures.

