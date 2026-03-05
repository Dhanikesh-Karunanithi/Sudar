# Pushing to GitHub

This project can be pushed to two remotes:

- **Public Sudar repo** (mainstream): **https://github.com/Dhanikesh-Karunanithi/Sudar.git**
- **Work/private repo** (optional): **https://github.com/lorddannykay/ByteOS.git**

Run all steps from the project root folder (e.g. `ByteAI/ByteOS`).

---

## Pushing to the public Sudar repo (Dhanikesh-Karunanithi/Sudar)

### 1. Ensure branch and commits are ready

```bash
git branch -M main
git status
# If you have uncommitted changes, add and commit them:
# git add -A
# git commit -m "Your message"
```

### 2. Add the Sudar remote and push

```bash
git remote add sudar https://github.com/Dhanikesh-Karunanithi/Sudar.git
```

Then choose one:

- **Replace the existing Sudar repo content** (e.g. if it only has a LICENSE):  
  `git push sudar main --force`

- **Keep existing Sudar history** (merge with what’s on GitHub):  
  ```bash
  git fetch sudar
  git pull sudar main --allow-unrelated-histories
  # Resolve any conflicts, then:
  git push sudar main
  ```

If the remote is already added, update its URL:

```bash
git remote set-url sudar https://github.com/Dhanikesh-Karunanithi/Sudar.git
```

- Use a **Personal Access Token** (repo scope) or **GitHub CLI** (`gh auth login`) if prompted for auth.

---

## Pushing to the work/private repo (lorddannykay/ByteOS)

### 1. Ensure initial commit exists

```bash
git status
# If you see untracked or modified files to include:
git add -A
git commit -m "Initial commit: Sudar - AI-native Learning OS with research foundation"
```

### 2. Set main branch and add remote

```bash
git branch -M main
git remote add origin https://github.com/lorddannykay/ByteOS.git
```

If `origin` already exists:  
`git remote set-url origin https://github.com/lorddannykay/ByteOS.git`

### 3. Push

```bash
git push -u origin main
```

If the remote already has a README/license and push is rejected:  
`git pull origin main --allow-unrelated-histories` then `git push -u origin main`.

---

## What’s in the repo

- **README.md** — Project overview, research positioning, quick start.
- **RESEARCH_FOUNDATION.md** — Learning sciences, references, citation.
- **LICENSE** — MIT.
- **CONTRIBUTING.md** — How to contribute.
- **.gitignore** — Excludes `.env`, `.env.local`, `node_modules`, `.cursor/`, build outputs.
- **assets/logos/** — Sudar brand logos (used in Learn and Studio).
- **byteos-studio/** — Admin app (Next.js 14).
- **byteos-learn/** — Learner app (Next.js 14).
- **byteos-intelligence/** — Python FastAPI service.
- **docs/** — PRD, strategic path, action plans, features, personas, flows.
- **ECOSYSTEM.md**, **AGENTS.md** — Architecture and agent instructions.

Secrets (`.env`, `.env.local`) are **not** committed. Copy `.env.example` to `.env.local` in each app and fill in your keys after cloning.
