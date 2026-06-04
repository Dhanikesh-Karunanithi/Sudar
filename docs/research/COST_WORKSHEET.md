# Sudar — marginal AI cost worksheet (reproducibility)

Use this template so economics claims in the paper and README stay **separable** from total cost of ownership (TCO).

**Paper alignment (June 2026):** Headline **$0.021 per learner per month** (Together AI 8B + Edge-TTS, high-engagement scenario below). Sensitivity **$0.011–$0.042** at 0.5×/2× usage.

## 1. Definitions

| Term | Meaning |
|------|--------|
| **Marginal AI cost** | Provider tokens, embeddings, image/video generation units, TTS minutes, and Intelligence hosting attributable to one learner session or one course generation run. |
| **TCO** | LMS seat fees, support, content production time, legal/compliance, storage, bandwidth, Supabase plan, Vercel/Railway, monitoring, and staff time. |

Do **not** compare marginal AI cost per learner-month to Statista “training spend per employee” without an explicit “not comparable” caveat.

## 2. Defined workload (paper Section 5 — high engagement)

Per **active learner per month**:

| Workload | Count | Notes |
|----------|-------|--------|
| Course generation (Studio) | 10 | Document-to-course, ~8B model |
| Tutor chat sessions | 20 | ~1k in + 500 out tokens per session (avg.) |
| Mindmap + flashcard generation | 4 each | Bundled with course/personalisation |
| TTS (Listen) | 30 min | Edge-TTS ($0 marginal) |
| Adaptive personalisation | included | Overhead in tutor + generation tokens |

**Pricing snapshot:** Q2 2026 Together AI 8B list price (paper appendix); Edge-TTS $0.

## 3. Worked example (headline scenario)

| Workload | Assumption | Tokens / units | Unit price | Extended /mo (1 learner) |
|----------|------------|----------------|------------|-------------------------|
| Tutor | 20 × (1k in + 500 out) | 20k in, 10k out | $0.06 / 1M in, $0.06 / 1M out | ~$0.0018 |
| Course gen | 10 × (~50k in + 20k out) | 500k in, 200k out | same | ~$0.018 |
| Mindmap/cards | 8 × (~5k out) | 40k out | same | ~$0.0024 |
| TTS | 30 min Edge | 30 min | $0 | $0 |
| **Subtotal / learner / month** | | | | **≈ $0.021** |

At **1,000 learners**: **$21/month**, **$252/year** (matches `paper.tex` Table marginal-ai and appendix).

At **10,000 learners**: **$210/month**.

## 4. Sensitivity

| Multiplier | $/learner/month (8B stack) |
|------------|----------------------------|
| 0.5× usage | ≈ $0.011 |
| 1.0× (baseline) | ≈ $0.021 |
| 2.0× usage | ≈ $0.042 |

## 5. Closed-model contrast (same workload, 1k learners)

| Stack | $/learner/mo | Annual (1k) |
|-------|--------------|-------------|
| GPT-4o + OpenAI TTS-1 | $3.41 | $40,860 |
| Claude 3.5 + Azure TTS | $3.74 | $44,820 |

(From provider list prices; re-validate before each submission.)

## 6. Platform list prices (illustrative only — appendix)

Docebo / Sana rows in the paper appendix are **not** measured Sudar costs; they illustrate enterprise seat pricing vs marginal AI. Do not merge into the headline $0.021 figure.

## 7. Where to log results

- Pilot outcomes: [PILOT_PROTOCOL.md](./PILOT_PROTOCOL.md)
- Paper text: [paper.tex](./paper.tex) §5 and cost appendix
- **Measured usage (production)**: Sudar Studio → Analytics → AI usage CSV from `ai_usage_daily_org`; migration `supabase/migrations/20260529120000_ai_usage_monitoring.sql`
- Latency: [benchmark-results.json](./benchmark-results.json) via `node scripts/benchmark-sudar.mjs`
