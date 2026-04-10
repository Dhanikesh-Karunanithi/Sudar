# Deployment and data posture (internal)

Use this memo to scope HIPAA, PCI, and regional law discussions.

## Deployment models

1. **Sudar-hosted SaaS** — Sudar (or a partner) operates Studio, Learn, Supabase project, and Intelligence. Customer is controller for learner data; Sudar is processor under DPA terms you define.
2. **Customer VPC / self-hosted** — Customer operates infrastructure; Sudar supplies software. Responsibility shifts per contract; subprocessors list differs.

## Data categories

| Category | Typical in Sudar | Notes |
|----------|------------------|--------|
| Learner PII | Name, email, profile | In `profiles`, auth |
| Learning records | Events, progress, tutor messages | `learning_events`, `ai_interactions` |
| Cardholder data | Usually **none** in-app | Prefer Stripe Checkout / hosted fields; Sudar should not store PAN |
| PHI | **Only if** customer puts it in content | Healthcare scenarios need BAA and scope |

## Markets

Document primary regions (EU/UK/US) to drive GDPR, UK GDPR, and state privacy laws. AI Act obligations depend on use case and role (provider vs deployer); see AI_SYSTEM_REGISTER.md.
