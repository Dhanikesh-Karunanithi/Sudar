# Sudar — marginal AI cost worksheet (reproducibility)

Use this template so economics claims in the paper and README stay **separable** from total cost of ownership (TCO).

## 1. Definitions

| Term | Meaning |
|------|--------|
| **Marginal AI cost** | Provider tokens, embeddings, image/video generation units, TTS minutes, and Intelligence hosting attributable to one learner session or one course generation run. |
| **TCO** | LMS seat fees, support, content production time, legal/compliance, storage, bandwidth, Supabase plan, Vercel/Railway, monitoring, and staff time. |

Do **not** compare marginal AI cost per learner-month to Statista “training spend per employee” without an explicit “not comparable” caveat.

## 2. Inputs (fill per month or per pilot)

- Model provider(s) and list prices (per 1M tokens, per image, per TTS minute).
- Typical **tutor** session: messages per session, average input/output tokens, sessions per learner per month.
- Typical **course generation** run: Studio prompt + document pages + output modules.
- **Watch** (SudarVid): jobs per learner per month, average slide count, TTS characters.
- **Listen**: TTS characters per learner per month.
- **Flashcards / mindmap**: calls per learner per month and average tokens.

## 3. Worked example row (replace with your measured numbers)

| Workload | Assumption | Tokens / units | Unit price | Extended |
|----------|------------|------------------|------------|----------|
| Tutor | 20 msgs × 1k in + 500 out | … | … | … |
| TTS | 30 min / learner | … | … | … |

Sum extended column → **$/month** for the scenario, then divide by **active learners** to get **$/learner/month** for that scenario only.

## 4. Sensitivity

- Repeat with **2×** and **0.5×** usage; record a range, not a single headline number.
- If using free/cheap tiers (Edge TTS, free credits), note **promotional** or **regional** variance.

## 5. Where to log results

- Pilot outcomes: [PILOT_PROTOCOL.md](./PILOT_PROTOCOL.md)
- Paper text: keep numbers in `paper.tex` aligned with the latest filled worksheet (date the run in a footnote or appendix).
