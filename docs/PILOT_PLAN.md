# Sudar / ALP — Pilot Plan

**Purpose**: Define target partners, success criteria, and data collection for the first Sudar (and ALP) pilots. Results will inform a follow-up paper and the LAMP paper’s “Planned evaluation design” (see [docs/LAMP-Updated-Draft.md](LAMP-Updated-Draft.md) Section 5).

**Related**: [docs/LAMP_BUILD_PLAN.md](LAMP_BUILD_PLAN.md) Phase 1 (Build) and Phase 3 (Pilot & OSS), [docs/ALP_API.md](ALP_API.md).

---

## 1. Target partners and outreach

| Partner type | Description | Status |
|--------------|-------------|--------|
| **University / HE** | One institution using Moodle (or similar) for a single course or programme; ALP connector (SudarMemory, SudarChat, SudarRecommend) deployed alongside existing LMS. | Outreach in progress; no commitment yet. |
| **Corporate L&D** | One mid-market company using Sudar Learn standalone (no ALP) for a mandatory or upskilling path; 50–200 learners. | Outreach in progress; no commitment yet. |

**Outreach actions**: Contact existing network; respond to inbound interest from repo/docs; document “Pilot with us” in README with a clear contact (e.g. connect@… or GitHub discussion).

**User mapping for ALP**: When the host LMS (e.g. Moodle) is used, map LMS user IDs to Sudar `profiles.id` (e.g. LTI `user_id`, SSO subject, or a one-time sync table). Document the mapping approach per partner in this section as pilots are agreed.

---

## 2. Success criteria

Pilots are considered successful if we can measure the following; exact thresholds to be set with the partner.

| Dimension | Metrics | Notes |
|-----------|---------|--------|
| **Adoption** | DAU/MAU, number of active learners, % of enrolled who start at least one session | Baseline: enrollments; target: e.g. >40% start within 2 weeks. |
| **Engagement** | Sessions per learner per week, time-on-task per session, tutor queries per learner, modality switches | Indicates whether learners use Sudar and the tutor. |
| **Learning (early)** | Quiz scores (pre/post if available), completion rate per course/path, time-to-complete | When pre/post or comparison group exists; otherwise completion and time only. |
| **ALP-specific** | Event ingestion volume (events/week via `POST /api/alp/events`), tutor/next-action calls from LMS | Validates that the ALP pipeline is used in production. |

---

## 3. Data collection and ethics

- **Events**: All learning events (including ALP-ingested) are stored in `learning_events`; tutor interactions in `ai_interactions`. Learner profile and event data remain in the tenant’s Supabase project (or the pilot’s dedicated project).
- **Exports for research**: Aggregated, anonymised tables (e.g. counts by cohort, by week; no PII). Export scripts to be documented in repo (e.g. `scripts/export-pilot-stats`) with clear “no PII” checks.
- **Anonymisation**: For any follow-up paper, only report: counts, rates, aggregate scores, and (if agreed) de-identified quotes. No names, emails, or identifiers. Partner agreement (e.g. data-sharing addendum) to be signed before sharing any aggregate with the research team.
- **Retention**: Per-partner policy (e.g. delete or retain anonymised aggregates for N years). Document in pilot agreement.

---

## 4. Link to planned evaluation design (LAMP paper)

The LAMP paper’s “Planned evaluation design” (Section 5) defines:

- **RQ1**: Does Sudar+ALP improve learning outcomes (scores, time-to-mastery) relative to a standard LMS?
- **RQ2**: Does longitudinal tutor memory reduce repeated errors and dropout (cf. RL-ITS findings)?
- **RQ3**: What is the cost per unit of learning gain relative to incumbent platforms?

This pilot plan is the **first step**: we collect adoption, engagement, and (where possible) early learning metrics so that a later, controlled study (A/B or cluster-randomised) can be designed with realistic effect sizes and sample sizes. Pilot results will be reported in a **subsequent paper** or a revision of the LAMP paper (e.g. “Pilot results” subsection) once data is available.

---

## 5. Checklist before going live with a partner

- [ ] Partner agreement (scope, data use, anonymisation, retention).
- [ ] Sudar (and, if ALP, the connector) deployed and stable; ALP_API_KEY and user mapping configured.
- [ ] At least one course or path with content and (if applicable) quizzes.
- [ ] Export/anonymisation script reviewed and run once on test data.
- [ ] Contact and “Pilot with us” updated in README/docs.

---

*Last updated: 2026-03-13. Update this document as partners are signed and pilot timelines are set.*
