# Get the PDF and Publish on arXiv (Browser Guide)

This guide covers **(1) how to get the PDF** of the paper and **(2) how to submit it to arXiv using your browser**.

---

## Part 1: Get the PDF

You have two options. **Option A (Overleaf)** requires no installation and works entirely in the browser.

### Option A: Build the PDF with Overleaf (recommended, no install)

1. **Go to [Overleaf](https://www.overleaf.com)** and sign in or create a free account.

2. **Create a new project**
   - Click **New Project** → **Blank Project**.
   - Name it (e.g. `ALP-paper`).

3. **Add the paper files**
   - In the project, you’ll see a default `main.tex`. **Delete** `main.tex` (or leave it and we’ll point the project to `paper.tex`).
   - Click **New File** and create a file named **`paper.tex`**. Paste in the full contents of your repo’s `docs/research/paper.tex`.
   - Click **New File** and create **`references.bib`**. Paste in the full contents of `docs/research/references.bib`.

4. **Set the main file** (required if you see `Emergency stop` on `main.tex`)
   - Click the **gear icon** (bottom-left of the editor) → **Settings**.
   - Open the **Compiler** tab.
   - **Main document** must be **`paper.tex`**, not **None**. If it is **None**, Overleaf tries to compile missing `main.tex` and fails with “No PDF”.
   - Close Settings, then **Clear cached files** → **Recompile**.

5. **Compile**
   - Click **Recompile** (or the green **Recompile** button). The first run may take a minute.
   - If you see errors, run **Recompile** again (BibTeX is run on second pass).
   - When it succeeds, the PDF appears on the right.

6. **Download the PDF**
   - Click the **PDF** icon (download arrow) above the PDF viewer, or use the **Menu** → **Download PDF**. Save `paper.pdf` for your records and for checking before you submit to arXiv.

### “No PDF” / compiles `main.tex` / Emergency stop

Overleaf defaults to **`main.tex`**. This project uses **`paper.tex`** as the full document.

1. In the file list, confirm **`paper.tex`** exists and is large (~900+ lines), starting with `\documentclass` and ending with `\end{document}`.
2. If **`main.tex`** exists and is empty or tiny, **delete** it (or rename to `main.tex.bak`).
3. If **`output.pdf`** appears in the file list, **rename or delete** it (Overleaf blocks compile when that name exists).
4. Set **Main document** to **`paper.tex`** (menu → Settings → Main document, or right-click `paper.tex` → Set as main file).
5. **Clear cached files** → **Recompile** twice.

Uploading only `references.bib` does not replace `paper.tex`—keep both files in the project.

### Common Overleaf warnings (safe to ignore or fixed in repo)

| Warning | Meaning | Action |
|---------|---------|--------|
| `fixltx2e` not required | Overleaf default package; harmless on modern LaTeX | Ignore, or disable in project settings if offered |
| BibTeX: `unesco2024` / `itu2024` entry type | `@report` is not in plain BibTeX | Use latest `references.bib` (`@misc` entries) |
| BibTeX: empty `booktitle` on `gagne1985` | Wrong entry type (`@incollection` without booktitle) | Use latest `references.bib` (`@book`) |
| **0 Errors** | PDF built successfully | You can download and submit |

After updating `references.bib`, click **Recompile** **twice** (or **Clear cached files** → Recompile) so citations refresh.

You will use the **same Overleaf project** (or the same `paper.tex` and `references.bib` on your machine) to prepare the files you upload to arXiv. arXiv will compile the LaTeX itself; you do **not** upload the PDF to arXiv (you upload the `.tex` and `.bib`).

---

### Option B: Build the PDF on your computer (TeX installed)

If you have **TeX Live** or **MiKTeX** installed:

1. Open a terminal in the repository's **`docs/research`** directory (path depends on your machine).

2. Run (PowerShell or Command Prompt):
   ```bash
   pdflatex paper
   bibtex paper
   pdflatex paper
   pdflatex paper
   ```

3. Open **`paper.pdf`** in the same folder.

If you don’t have TeX installed, use **Option A (Overleaf)**.

---

## Part 2: Publish on arXiv Using the Browser

Do this **after** you have confirmed the PDF compiles (e.g. in Overleaf or locally).

### Step 1: Create an arXiv account (if needed)

1. Go to **[https://arxiv.org](https://arxiv.org)**.
2. Click **Log in** (top right) → **Sign up**.
3. Register with your email; verify and set a password. You can also link an institutional or Google/ORCID login if available.

### Step 2: Start a new submission

1. Log in, then click **Submit** (top right) or go to **[https://arxiv.org/submit](https://arxiv.org/submit)**.
2. If prompted, agree to the submission instructions and **Continue**.

### Step 3: Upload your files

1. **Upload method**
   - Either **upload files one by one**, or  
   - **Upload a single .zip** containing only what’s needed.

2. **What to upload**
   - **Required:** `paper.tex`, `references.bib`
   - **Optional:** Any figure files (e.g. from `figures/`) only if you changed the paper to use `\includegraphics` for them. For the current version, figures are inside `paper.tex` (TikZ), so you only need `paper.tex` and `references.bib`.

3. **Do not upload**
   - No `.aux`, `.bbl`, `.log`, `.out`, or other build artifacts.
   - No PDF (arXiv generates it from your LaTeX).

4. **If you use a .zip**
   - Create a zip with **only** `paper.tex` and `references.bib` at the root of the archive (no subfolder nesting).
   - Example file name: **`arxiv-upload.zip`**.
   - Upload the `.zip` in the “Upload files” area.

5. After upload, arXiv will show the list of files. Confirm `paper.tex` and `references.bib` are there, then **Continue**.

### Step 4: Set the main TeX file

1. arXiv may ask for the **main .tex file** that builds the document.
2. Choose **`paper.tex`** (not `references.bib`).
3. **Continue**.

### Step 5: Add metadata (title, authors, abstract)

1. **Title**
   - Copy from the paper, e.g.:  
     `Learning That Remembers You: An AI-Native Ecosystem for Adaptive, Memory-Aware, and Multimodal Education at Scale`

2. **Authors**
   - Add your name (e.g. Dhanikesh Karunanithi) and, if you want, affiliation (e.g. “Independent” or your institution). Add co-authors if any.

3. **Abstract**
   - Copy the full abstract from `paper.tex` (the `\begin{abstract}...\end{abstract}` block, without the LaTeX commands).

4. **Comments** (optional)
   - You can add: “Reference implementation: https://github.com/Dhanikesh-Karunanithi/Sudar”

5. **Continue**.

### Step 6: Choose a category

1. Under **Categories**, add at least one. Suggested:
   - **cs.CY** (Computers and Society) — good fit for education and learning systems.
   - Or **cs.HC** (Human-Computer Interaction), **cs.AI** (Artificial Intelligence), or **cs.LG** (Machine Learning).

2. You can add a secondary category if you like. Then **Continue**.

### Step 7: License

1. Choose a license for your preprint. Common choice: **Creative Commons Attribution 4.0 (CC BY 4.0)** (allows reuse with credit).
2. **Continue**.

### Step 8: Review and submit

1. Review the summary: files, title, authors, abstract, category, license.
2. If you need to change something, use the back/Edit links.
3. When ready, click **Submit** (or **Submit to arXiv**).
4. The submission will go to **moderation**. You’ll get an email when it’s accepted; typically within one or two business days. After that, the preprint will be public and you’ll get the arXiv link (e.g. `https://arxiv.org/abs/XXXX.XXXXX`).

---

## Quick checklist before you submit to arXiv

- [ ] PDF compiles (e.g. in Overleaf) and looks correct.
- [ ] `paper.tex` tone pass done (Section 5 economics, conclusion, appendix vendor caveat).
- [ ] Cost numbers match [COST_WORKSHEET.md](COST_WORKSHEET.md) (headline **$0.021/learner/month**).
- [ ] Run `npm run benchmark:sudar`; refresh Table perf in `paper.tex` if `benchmark-results.json` changed.
- [ ] Only `paper.tex` and `references.bib` uploaded (no build artifacts, no PDF).
- [ ] Main file set to `paper.tex`.
- [ ] Title, authors, abstract, and **Keywords** filled in (copy from `paper.tex`).
- [ ] Primary category **cs.CY**; cross-list **cs.HC** or **cs.AI** (optional).
- [ ] License selected (e.g. CC BY 4.0).
- [ ] Author name and GitHub URL visible (arXiv is not double-blind).

---

## After your preprint is live

- Replace `XXXX.XXXXX` in the citation in `ARXIV_SUBMISSION.md` with your actual arXiv ID.
- You can add the arXiv link to your repo README and to the paper’s “Reference implementation” footnote in future revisions.
