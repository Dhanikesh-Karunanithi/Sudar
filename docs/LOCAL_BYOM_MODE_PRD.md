# Sudar Local BYOM Mode — Technical PRD and API Contract
**Version**: 0.1 (Draft) | **Date**: 2026-05-01 | **Status**: Proposed  
**Owner**: Sudar Core Product + Platform  
**Tagline alignment**: *Learns with you, for you.*

---

## 1) Executive Summary

Sudar Local BYOM Mode (Bring Your Own Model) enables organizations and learners to connect Sudar to locally hosted AI runtimes on desktop devices or local networks, reducing cloud dependency for low-connectivity environments and privacy-sensitive deployments.

This mode does **not** require Sudar to distribute model weights. Users install supported runtimes (for example, Ollama or LM Studio local server), choose a model they are licensed to use, and connect Sudar through a validated provider profile.

---

## 2) Problem and Opportunity

### 2.1 Problem
- Many target regions have unstable or expensive internet access.
- Cloud inference costs can block adoption for budget-constrained institutions.
- Some organizations require strict data locality.

### 2.2 Opportunity
- Enable local-first inference for core learning tasks (tutor chat, summarization, flashcards, quiz explanation).
- Keep heavy generation in cloud/hybrid mode when needed.
- Expand accessibility while preserving Sudar's adaptive learning architecture.

---

## 3) Goals and Non-Goals

### 3.1 Goals
- Introduce runtime policy controls: `cloud`, `local`, `hybrid`.
- Support OpenAI-compatible local inference endpoints via provider adapters.
- Provide robust failover behavior and user-visible capability checks.
- Ship guided setup in Studio and Learn for non-technical admins.
- Preserve existing telemetry and learner twin updates.

### 3.2 Non-Goals (v1)
- Sudar-managed hosting or redistribution of model weights.
- Full offline operation for every Sudar feature.
- On-device video generation parity with cloud workflows.
- Automated legal validation for third-party model licenses.

---

## 4) Primary Use Cases

1. **Low-connectivity org**: School uses local network server + open model for tutor chat and module summarization.
2. **Privacy-sensitive enterprise**: Org sets strict local policy for learner prompts and responses.
3. **Cost-aware deployment**: Org runs local models for high-volume tasks, cloud for advanced generation.

---

## 5) Product Scope (v1)

### 5.1 In Scope
- Sudar Learn tutor query path.
- Studio lightweight generation (summarize/rewrite/quiz draft/flashcards draft).
- Provider setup and health test UI.
- Capability detection and policy-aware routing.
- Observability and audit trails for local-vs-cloud routing.

### 5.2 Out of Scope
- Full offline sync engine for all products.
- Local embeddings/vector DB migration for RAG corpus at scale (future phase).
- Mobile native runtime integration (future roadmap).

---

## 6) Functional Requirements

### 6.1 Policy and Governance
- FR-LBYOM-001: Org admin can set AI runtime policy to `cloud`, `local`, or `hybrid`.
- FR-LBYOM-002: Org admin can enforce strict-local mode (no cloud fallback).
- FR-LBYOM-003: Learner can view active runtime mode and reason for fallback when applicable.

### 6.2 Provider Configuration
- FR-LBYOM-004: Org admin can configure one or more local providers with:
  - provider type
  - base URL
  - model ID
  - timeout and max token defaults
  - auth mode (none, bearer token, local network key)
- FR-LBYOM-005: Sudar validates provider connectivity and compatibility before activation.

### 6.3 Request Routing and Failover
- FR-LBYOM-006: Sudar Intelligence routes model requests based on policy + feature capability.
- FR-LBYOM-007: In `hybrid`, unavailable local tasks can fallback to cloud with structured reason.
- FR-LBYOM-008: In strict local mode, requests fail fast with actionable UI guidance.

### 6.4 Capability Gating
- FR-LBYOM-009: Each model endpoint maps to declared capabilities:
  - `chat`
  - `summarize`
  - `rewrite`
  - `flashcards`
  - `quiz_explain`
- FR-LBYOM-010: UI only enables features that are available under current policy + provider.

---

## 7) Non-Functional Requirements

- NFR-LBYOM-001: P95 local tutor response target <= 8s for short prompts on supported desktop hardware.
- NFR-LBYOM-002: Provider health check latency target <= 2s in same LAN.
- NFR-LBYOM-003: No raw secret keys stored client-side; secure server-side storage only.
- NFR-LBYOM-004: Route decision and fallback reason logged for auditability.
- NFR-LBYOM-005: Feature degradation must be graceful and explicit to the learner/admin.

---

## 8) System Architecture

### 8.1 High-Level Flow
1. Learn or Studio sends generation/tutor request to local BFF route.
2. BFF forwards to Sudar Intelligence with org/user context.
3. Intelligence `ModelRouter` evaluates:
   - org policy
   - feature capability requirement
   - local provider health
4. Router invokes chosen provider adapter.
5. Response returns with routing metadata for observability and UI.

### 8.2 Provider Adapter Interface (Python)

```python
class ModelProviderAdapter(Protocol):
    async def health_check(self) -> ProviderHealth: ...
    async def chat(self, req: ChatRequest) -> ChatResponse: ...
    async def summarize(self, req: SummarizeRequest) -> SummarizeResponse: ...
    async def rewrite(self, req: RewriteRequest) -> RewriteResponse: ...
```

### 8.3 Initial Providers
- `openai_compatible_local` (covers Ollama, LM Studio local server, llama.cpp server adapters)
- existing `together_cloud`, `openai_cloud`, `anthropic_cloud` for fallback/hybrid

---

## 9) Data Model and Policy Contract

Use `organisations.settings` extension:

```json
{
  "ai_runtime": {
    "mode": "cloud|local|hybrid",
    "strict_local": false,
    "fallback_enabled": true,
    "providers": [
      {
        "id": "local-main",
        "type": "openai_compatible_local",
        "base_url": "http://127.0.0.1:11434/v1",
        "model": "qwen2.5:7b-instruct-q4_k_m",
        "auth_mode": "none",
        "encrypted_secret_ref": null,
        "timeout_ms": 30000,
        "max_tokens_default": 512,
        "capabilities": ["chat", "summarize", "rewrite", "flashcards", "quiz_explain"],
        "active": true
      }
    ]
  }
}
```

Optional learner preference extension in `learner_profiles.ai_tutor_context.preferences`:

```json
{
  "runtime_preference": "org_default|prefer_local|prefer_cloud"
}
```

---

## 10) API Contract (v1)

All responses use:

```json
{ "success": true, "data": {}, "error": null }
```

### 10.1 Studio / Learn BFF APIs (Next.js)

#### `POST /api/ai/runtime/providers/test`
Validates a provider config before save.

Request:
```json
{
  "type": "openai_compatible_local",
  "baseUrl": "http://127.0.0.1:11434/v1",
  "model": "qwen2.5:7b-instruct-q4_k_m",
  "authMode": "none",
  "token": null,
  "timeoutMs": 10000
}
```

Response:
```json
{
  "success": true,
  "data": {
    "reachable": true,
    "modelAvailable": true,
    "latencyMs": 820,
    "capabilities": ["chat", "summarize", "rewrite"],
    "warnings": []
  }
}
```

#### `PUT /api/org/ai-runtime-policy`
Writes org-level runtime policy.

Request:
```json
{
  "mode": "hybrid",
  "strictLocal": false,
  "fallbackEnabled": true,
  "providers": [
    {
      "id": "local-main",
      "type": "openai_compatible_local",
      "baseUrl": "http://127.0.0.1:11434/v1",
      "model": "qwen2.5:7b-instruct-q4_k_m",
      "authMode": "none",
      "token": null,
      "timeoutMs": 30000,
      "maxTokensDefault": 512,
      "active": true
    }
  ]
}
```

#### `GET /api/org/ai-runtime-policy`
Returns effective policy + provider health snapshot.

### 10.2 Sudar Intelligence APIs

#### `POST /api/runtime/resolve`
Returns route decision for capability and context.

Request:
```json
{
  "orgId": "uuid",
  "userId": "uuid",
  "feature": "tutor_query",
  "capabilityRequired": "chat"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "decision": "local",
    "providerId": "local-main",
    "model": "qwen2.5:7b-instruct-q4_k_m",
    "fallbackAllowed": true,
    "reason": "policy_hybrid_local_healthy"
  }
}
```

#### `POST /api/tutor/query` (extended response metadata)
Existing endpoint remains; response gains routing metadata:

```json
{
  "success": true,
  "data": {
    "answer": "string",
    "routing": {
      "decision": "local|cloud",
      "providerId": "local-main",
      "model": "string",
      "fallbackUsed": false,
      "fallbackReason": null
    }
  }
}
```

#### `POST /api/content/generate` (policy-aware)
Existing endpoint remains; `routing` metadata mirrors tutor response.

### 10.3 Error Contract

Standardized error codes:
- `LOCAL_PROVIDER_UNREACHABLE`
- `LOCAL_MODEL_NOT_FOUND`
- `LOCAL_CAPABILITY_UNSUPPORTED`
- `STRICT_LOCAL_NO_FALLBACK`
- `CLOUD_FALLBACK_DISABLED`
- `RUNTIME_POLICY_INVALID`

---

## 11) Failover Rules

1. If mode is `cloud`, always route cloud.
2. If mode is `local` and local fails:
   - strict local: return error with remediation.
   - non-strict local + fallback enabled: fallback cloud.
3. If mode is `hybrid`:
   - prefer local when capability and health pass.
   - fallback cloud on timeout/unavailable/unsupported capability.
4. Every fallback event logs reason and request feature type.

---

## 12) UX Screens (v1)

### 12.1 Studio — Governance/AI Runtime
- Runtime mode selector: Cloud / Local / Hybrid
- Provider list with status badges (healthy, degraded, offline)
- "Add local provider" wizard:
  - provider type
  - endpoint and model
  - test connection
  - save and activate

### 12.2 Learn — Tutor Runtime Indicator
- Non-intrusive badge in tutor panel:
  - `Local model active`
  - `Cloud fallback used` (with short reason)
- If strict local and unavailable:
  - actionable CTA: "Ask your admin to reconnect local model."

### 12.3 Admin Reporting
- Runtime usage metrics:
  - local request count
  - cloud fallback count
  - strict-local failures

---

## 13) Security and Compliance

- Provider secrets stored encrypted server-side.
- Do not expose local endpoint credentials to browser clients.
- Add allowlist guidance for private/local endpoint ranges by org policy.
- Log only metadata for route decisions; avoid storing sensitive prompt content in operational logs.
- Add model-license disclaimer in setup UI: org is responsible for compliant model usage.

---

## 14) Rollout Plan and Success Metrics

### 14.1 Rollout
- Stage 1: Internal flag in dev + selected pilot orgs.
- Stage 2: Beta in Studio governance settings.
- Stage 3: General availability with docs and onboarding templates.

### 14.2 Success Metrics
- % AI requests served by local providers.
- Cloud token cost reduction per active learner.
- Tutor availability in low-connectivity sessions.
- Mean setup time for admin local provider onboarding.
- Fallback rate trend (should drop as local setup stabilizes).

---

## 15) Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Local runtime instability | Medium | High | Health checks, retry budget, fallback rules |
| Poor model quality on low-end hardware | High | Medium | Capability gating, model recommendations by device class |
| Misconfigured endpoints | High | Medium | Setup wizard + test endpoint + clear diagnostics |
| License confusion | Medium | Medium | BYOM disclaimer + docs linking to upstream model terms |
| Observability gaps | Medium | High | Routing metadata and fallback audit events |

---

## 16) Dependencies

- `sudar-intelligence`: model router + provider adapters.
- `sudar-studio`: governance UI and policy management.
- `sudar-learn`: runtime status UX and graceful degradation.
- Supabase: org settings and audit metadata persistence.

---

## 17) Open Questions

1. Should org policy allow learner-level override in enterprise contexts?
2. Should strict-local mode disable all unsupported features in UI preemptively?
3. Should local provider checks include benchmark prompt for quality floor?
4. Which default model recommendations should Sudar document for 8GB, 16GB, and 32GB RAM classes?

---

*Draft prepared for roadmap approval and implementation planning.*
