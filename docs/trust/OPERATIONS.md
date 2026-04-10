# Operations runbook (outline)

## Personal data export (DSAR-style)

1. Identify subject in `profiles` / auth.
2. Export related rows: `learning_events`, `ai_interactions`, `enrollments`, `learner_profiles` (as permitted by law).
3. Provide machine-readable bundle to requester via secure channel.

## Erasure

1. Delete or anonymise subject identifiers per retention policy.
2. Cascade rules: respect FK constraints; Supabase auth user deletion as required.

## Security incident

1. Contain (rotate keys, block tokens).
2. Assess scope (tables, logs, model provider retention).
3. Notify customer DPO/legal per contract and regulation.

*Operational detail belongs in your internal wiki; this file is a checklist stub.*
