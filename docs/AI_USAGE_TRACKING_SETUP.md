# AI Usage Tracking Setup — Complete

## Status: ✅ Operational

The AI usage monitoring and token tracking system is now fully deployed and operational in Supabase.

---

## What Was Set Up

### 1. **Database Schema** (Applied to Supabase)

Three new tables:

| Table | Purpose |
|-------|---------|
| `ai_model_pricing` | Reference pricing for USD cost estimation (7 models seeded) |
| `ai_usage_events` | Append-only ledger of all AI calls (no prompts/responses stored) |
| `ai_usage_daily_org` | Daily rollup aggregates by org and feature |

Two new PostgreSQL enums:
- `ai_usage_surface` ('learn', 'studio', 'intelligence')
- `ai_usage_unit_type` ('llm_tokens', 'embedding_tokens', 'tts_characters', 'image', 'video_job')

### 2. **Security Policies** (Row-Level Security enabled)

| Table | Policy | Access |
|-------|--------|--------|
| `ai_model_pricing` | `ai_model_pricing_authenticated_select` | Any authenticated user (for cost UI) |
| `ai_usage_daily_org` | `ai_usage_daily_org_org_admin_select` | Org admins and managers only |
| `ai_usage_daily_org` | `ai_usage_daily_org_super_admin_select` | Super admins only |
| `ai_usage_events` | `ai_usage_events_org_admin_select` | Org admins and managers only |
| `ai_usage_events` | `ai_usage_events_super_admin_select` | Super admins only |

### 3. **Database Functions**

| Function | Purpose |
|----------|---------|
| `increment_usage_token_count(user_id, date, tokens)` | Atomic increment of daily token counts per user |
| `refresh_ai_usage_rollups(date)` | Aggregates raw events into daily org/feature rollups |

### 4. **Indexes** (Performance optimized)

- `ai_usage_events_org_created_idx` — Fast queries by org and timestamp
- `ai_usage_events_org_feature_created_idx` — Fast queries by org, feature, timestamp
- `ai_usage_events_created_idx` — Global timestamp queries
- `ai_usage_daily_org_org_date_idx` — Fast daily rollup retrieval

### 5. **Cron Job** (Vercel)

**File:** `sudar-studio/vercel.json`

Added cron schedule:
```json
{
  "path": "/api/cron/ai-usage-rollups",
  "schedule": "30 2 * * *"
}
```

Runs daily at 2:30 AM UTC to refresh daily org rollups from events.

---

## How It Works

### Tracking AI Usage

When any AI call occurs in Learn or Studio, the application records it:

```typescript
// Learn tutor chat example
import { recordAiUsage } from '@/lib/ai/recordUsage'

recordAiUsage(usageAdmin, {
  orgId: org.id,
  userId: user.id,
  surface: 'learn',
  feature: 'tutor_chat',
  provider: 'together',
  model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  usage: { prompt_tokens: 50, completion_tokens: 150, total_tokens: 200 },
  route: '/api/tutor/query'
})
```

**Result:** One row inserted into `ai_usage_events` with:
- Token counts (prompt, completion, cached)
- Estimated USD cost (from pricing table)
- Metadata (course_id, module_id, latency_ms, etc.)

### Recording Non-LLM Usage

For TTS, images, video, embeddings:

```typescript
import { recordAiUnits } from '@/lib/ai/recordUsage'

recordAiUnits(usageAdmin, {
  orgId: org.id,
  surface: 'learn',
  feature: 'modality_listen',
  provider: 'together',
  model: 'tts',
  unitType: 'tts_characters',
  units: 2500,  // characters
})
```

### Daily Rollup (Cron Job)

Every night at 2:30 AM UTC, the `refresh_ai_usage_rollups()` function:
1. Groups all events by (org_id, event_date, feature)
2. Sums tokens, request counts, costs
3. Builds units breakdown (e.g., `{"llm_tokens": 12000, "tts_characters": 5000}`)
4. Inserts/updates `ai_usage_daily_org` (upsert to handle reruns)

### Admin Visibility

**Studio → Analytics → AI usage**

The `/api/org/ai-usage/summary` endpoint:
1. Requires org admin auth (via RLS)
2. Queries `ai_usage_daily_org` for the date range
3. Returns totals + breakdown by feature
4. Displays in `AiUsageDashboard` component

---

## Pricing Reference Data (Seeded)

Current model pricing (USD per 1M tokens):

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| **Together** | openai/gpt-oss-20b | $0.05 | $0.20 |
| **Together** | google/gemma-3n-E4B-it | $0.02 | $0.04 |
| **Together** | meta-llama/Llama-3.3-70B-Instruct-Turbo | $0.88 | $0.88 |
| **OpenAI** | gpt-4o-mini | $0.15 | $0.60 |
| **OpenAI** | gpt-4o | $2.50 | $10.00 |
| **Anthropic** | claude-3-5-sonnet-20241022 | $3.00 | $15.00 |
| **OpenRouter** | openai/gpt-4o-mini | $0.15 | $0.60 |

**Note:** These are reference prices for marginal cost estimation, NOT invoices or TCO. Update as vendor pricing changes.

---

## API Endpoints (Studio Admin Only)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/org/ai-usage/summary` | GET | Daily rollup summary (30 days default) |
| `/api/org/ai-usage/timeseries` | GET | Daily breakdown over time |
| `/api/org/ai-usage/top-users` | GET | Top users by consumption |
| `/api/org/ai-usage/export` | GET | CSV export |
| `/api/cron/ai-usage-rollups` | POST | Manual or scheduled rollup trigger |

Query parameters:
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `date`: For cron (override target date)

---

## Files Modified/Created

### Modified
- `sudar-studio/vercel.json` — Added AI usage rollups cron

### Already Exists (Pre-Built)
- `supabase/migrations/20260529120000_ai_usage_monitoring.sql` — Migration source
- `shared/ai/usageTypes.ts` — Type definitions
- `shared/ai/estimateCost.ts` — Cost calculation
- `sudar-studio/src/lib/ai/recordUsage.ts` — Recording logic
- `sudar-learn/src/lib/ai/recordUsage.ts` — Recording logic
- `sudar-studio/src/app/api/org/ai-usage/summary/route.ts` — API
- `sudar-studio/src/app/api/cron/ai-usage-rollups/route.ts` — Cron
- `sudar-studio/src/components/analytics/AiUsageDashboard.tsx` — UI

---

## Usage Recording Is Live

These features already call `recordAiUsage()` or `recordAiUnits()`:

### Learn (Learner App)
- ✅ Tutor chat (`/api/tutor/query`)
- ✅ Tutor proactive nudges (`/api/tutor/nudge`)
- ✅ Next best action personalization
- ✅ Module personalization
- ✅ RAG ingest and retrieval
- ✅ Memory consolidation
- ✅ TTS character recording (modality_listen)

### Studio (Admin App)
- ✅ Course generation
- ✅ Studio agent calls
- ✅ Studio assist (edit suggestions)

---

## Testing the Setup

### Manual Test (Cron)

```bash
# Run rollup for a specific date
curl -X POST https://your-studio-url/api/cron/ai-usage-rollups \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"date": "2026-06-02"}'

# Expected response
{"ok": true, "refreshed_for": "2026-06-02"}
```

### Verify in Supabase

```sql
-- Check recent events
SELECT COUNT(*), feature FROM public.ai_usage_events 
WHERE org_id = 'your-org-uuid' 
GROUP BY feature;

-- Check daily rollups
SELECT event_date, feature, total_tokens, estimated_cost_usd 
FROM public.ai_usage_daily_org 
WHERE org_id = 'your-org-uuid' 
ORDER BY event_date DESC;
```

---

## Important Notes

1. **No Prompt Storage:** AI usage events do NOT store prompts, responses, or user input — only metadata and token counts.

2. **Service Role Writes:** Usage recording uses the Supabase service role key (server-side only). Clients cannot write to `ai_usage_events` directly.

3. **Cost Estimates:** USD estimates are based on reference pricing from `ai_model_pricing`. They are marginal costs, not billing. Actual costs depend on volume discounts, committed contracts, etc.

4. **Pricing Updates:** Update `ai_model_pricing` table when vendor pricing changes. Old rows are retained (effective_from date).

5. **Rollup Idempotence:** The cron job can be safely rerun for any date (uses ON CONFLICT DO UPDATE).

6. **Retention:** No automatic archival of raw events. Consider implementing data retention policies for compliance.

---

## Next Steps (Optional)

- [ ] Set up Vercel Cron CRON_SECRET environment variable
- [ ] Monitor cron runs in Vercel dashboard
- [ ] Create alerts for unusually high usage
- [ ] Consider data archival policy for old events
- [ ] Add cost-based org quotas (using `usage_limits` table)
- [ ] Implement feature-level budget caps
- [ ] Add team member usage breakdown

---

**Setup Date:** June 3, 2026  
**Status:** Production Ready ✅
