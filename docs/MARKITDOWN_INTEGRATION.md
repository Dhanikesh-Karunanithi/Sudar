# MarkItDown integration (Sudar Intelligence)

Sudar uses [Microsoft MarkItDown](https://github.com/microsoft/markitdown) to convert uploaded knowledge-base files into **Markdown** before chunking and embedding.

---

## Where it runs

- **Service:** `sudar-intelligence`
- **Endpoint:** `POST /api/kb/convert-markdown` (multipart `file`)
- **Auth:** Supabase JWT or `X-Intelligence-Service-Secret` (same as other Intelligence routes)
- **Caller:** Learn cron worker via `sudar-learn/src/lib/intelligence/kb-convert.ts`

MarkItDown is **not** invoked from Studio/Learn upload routes directly — uploads are queued; the cron worker calls Intelligence.

---

## Install

In `sudar-intelligence`:

```bash
pip install -r requirements.txt
# includes: markitdown[all]>=0.1.6
```

Optional env (`.env.local`):

```env
MARKITDOWN_ENABLE_PLUGINS=false
MARKITDOWN_LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=...   # only needed for LLM vision / OCR plugins
```

---

## Supported formats

MarkItDown `[all]` extras cover PDF, Word, PowerPoint, Excel, HTML, CSV, JSON, XML, EPub, ZIP, images (metadata/OCR with LLM), and audio (transcription). Upload MIME allowlist is in `shared/knowledge-base/fileTypes.ts` (magic-byte verified at upload).

---

## Limits

- Max upload size: **50 MB** (Studio, Learn, Intelligence)
- Markdown truncated at **500k** characters before return
- Chunking in Learn: `chunkText()` up to **80** chunks per document

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `503 markitdown is not installed` | `pip install 'markitdown[all]'` in Intelligence venv |
| `502 MarkItDown conversion failed` | File corrupt, scanned PDF without OCR, or unsupported encoding |
| Queue stuck `pending` | Cron not firing — verify `CRON_SECRET`, Vercel cron, or `curl -X POST …/api/cron/process-kb-uploads -H "Authorization: Bearer $CRON_SECRET"` |
| `SUDAR_INTELLIGENCE_URL is not configured` | Learn env + Intelligence process running |
| Empty chunks | Document had no extractable text; try Azure Content Understanding (future) or OCR plugin |

---

## Security

MarkItDown runs with process privileges — only pass **validated** files from Supabase Storage (already magic-byte checked). See MarkItDown [security considerations](https://github.com/microsoft/markitdown#security-considerations).
