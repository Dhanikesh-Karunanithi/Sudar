# Subprocessors and data processors (typical)

**Deploy-specific:** Your production list may differ. Maintain the authoritative list for your deployment.

| Service | Role | Typical data |
|---------|------|--------------|
| Supabase | Database, auth, storage | All application data |
| Model APIs (Together, OpenAI, Anthropic, etc.) | Inference | Prompts, context snippets per your routing |
| Email (e.g. Resend) | Transactional email | Email addresses, template content |
| Hosting (e.g. Vercel) | App runtime | HTTP logs, minimal PII |

Customers should complete DPIA / transfer analysis (e.g. SCCs) against **their** final list.
