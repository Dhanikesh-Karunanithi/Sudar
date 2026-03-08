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

### Pushing as Dhanikesh-Karunanithi while Cursor/Git is logged in as lorddannykay

Git uses one stored credential per host (github.com). To push to **Sudar** as **Dhanikesh-Karunanithi** without changing your default account:

1. **Create a Personal Access Token (PAT)** on the **Dhanikesh-Karunanithi** account:
   - Log in at [github.com](https://github.com) as **Dhanikesh-Karunanithi** (use a browser incognito/private window if you’re usually logged in as lorddannykay).
   - Go to **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
   - **Generate new token (classic)**; give it a name (e.g. `Sudar push from Cursor`), set expiry, and enable the **repo** scope.
   - Copy the token once (it won’t be shown again).

2. **Point the `sudar` remote at GitHub using that account and token** (this uses Dhanikesh-Karunanithi only for this remote). Run this **once** — replace `YOUR_TOKEN_HERE` with the PAT:

   ```bash
   git remote set-url sudar https://Dhanikesh-Karunanithi:YOUR_TOKEN_HERE@github.com/Dhanikesh-Karunanithi/Sudar.git
   ```

   **Important:** Do **not** run `git remote set-url sudar https://github.com/...` (without the token) after this, or you will overwrite the URL and Git will fall back to lorddannykay and the push will fail with 403. The URL with the token is stored in your local `.git/config` only (not committed).

3. **Push:**

   ```bash
   git push sudar main --force
   ```

After this, `origin` (lorddannykay/ByteOS) continues to use your existing credential; only `sudar` uses the Dhanikesh-Karunanithi token. To stop using the token later (e.g. after switching accounts), run:

```bash
git remote set-url sudar https://github.com/Dhanikesh-Karunanithi/Sudar.git
```

- Use a **Personal Access Token** (repo scope) or **GitHub CLI** (`gh auth login`) if you prefer being prompted for auth instead of embedding a token in the URL.

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
- **LICENSE** — Apache 2.0.
- **CONTRIBUTING.md** — How to contribute.
- **.gitignore** — Excludes `.env`, `.env.local`, `node_modules`, `.cursor/`, build outputs.
- **assets/logos/** — Sudar brand logos (used in Learn and Studio).
- **byteos-studio/** — Admin app (Next.js 14).
- **byteos-learn/** — Learner app (Next.js 14).
- **byteos-intelligence/** — Python FastAPI service.
- **docs/** — PRD, strategic path, action plans, features, personas, flows.
- **ECOSYSTEM.md**, **AGENTS.md** — Architecture and agent instructions.

Secrets (`.env`, `.env.local`) are **not** committed. Copy `.env.example` to `.env.local` in each app and fill in your keys after cloning.
