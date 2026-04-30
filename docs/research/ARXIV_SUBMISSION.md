# arXiv submission guide — ALP / Adaptive Learning Layer paper

This folder contains the LaTeX source for the research paper and everything needed to build a PDF and submit to arXiv.

**→ For step-by-step instructions to get the PDF and submit via the browser, see [GET_PDF_AND_ARXIV.md](GET_PDF_AND_ARXIV.md).**

## Contents

| File | Purpose |
|------|---------|
| `paper.tex` | Main article (two-column, 10pt). |
| `references.bib` | BibTeX references. |
| `figures/README.md` | Notes on figures; TikZ is in the .tex. |
| `ARXIV_SUBMISSION.md` | This file. |

## Build the PDF

From this directory (`docs/research/`):

```bash
pdflatex paper
bibtex paper
pdflatex paper
pdflatex paper
```

Or use latexmk:

```bash
latexmk -pdf paper.tex
```

You need: `pdflatex`, `bibtex`, and standard packages (`tikz`, `booktabs`, `hyperref`, etc.). On Windows you can use MiKTeX or TeX Live; on macOS, MacTeX or TeX Live.

## Submitting to arXiv

1. **Create the submission package**
   - Required: `paper.tex`, `references.bib`.
   - Optional: if you switch to external figures, add `figures/*.pdf` or `figures/*.png` and change the .tex to use `\includegraphics` (see `figures/README.md`).
   - Do not include build artifacts (`.aux`, `.bbl`, `.log`, `.out`) in the upload.

2. **Upload at [arxiv.org](https://arxiv.org)**
   - New submission → Upload files (or upload a single .tar.gz or .zip containing `paper.tex`, `references.bib`, and any figure files).
   - arXiv will run pdflatex and bibtex; ensure the project compiles with those.

3. **Categories (suggested)**
   - **cs.CY** (Computers and Society) — education, learning systems.
   - **cs.HC** (Human-Computer Interaction) — if emphasizing learner experience.
   - **cs.LG** (Machine Learning) — if emphasizing AI/ML components.
   - **cs.AI** (Artificial Intelligence) — AI for education.
   - Primary suggestion: **cs.CY** or **cs.HC**.

4. **License**
   - Choose a license (e.g. CC BY 4.0) when prompted.

## After arXiv: venue options

- **Conferences:** AIED, EDM, L@S, CHI (education track), LAK.
- **Journals:** IJAIED, Computers & Education, IEEE TLT, Education and Information Technologies.

Use the same arXiv preprint as the basis; extend or shorten as needed for the target venue’s page limit and format.

## Citation (after preprint is live)

Once the preprint has an arXiv ID (e.g. 2603.xxxxx), you can cite:

```bibtex
@article{karunanithi2026alp,
  author  = {Karunanithi, Dhanikesh},
  title   = {Learning That Remembers You: An AI-Native Ecosystem for Adaptive, Memory-Aware, and Multimodal Education at Scale},
  journal = {arXiv preprint},
  year    = {2026},
  note    = {arXiv:XXXX.XXXXX},
  url     = {https://arxiv.org/abs/XXXX.XXXXX}
}
```

Replace `XXXX.XXXXX` with the actual arXiv identifier.

## Post-acceptance update checklist

After arXiv assigns your identifier, replace placeholder IDs in:

- `docs/research/ARXIV_SUBMISSION.md` (citation block)
- `docs/research/GET_PDF_AND_ARXIV.md` (example public URL)
- Any top-level README/docs references you want to publish publicly

Use the final canonical form:

- Abstract URL: `https://arxiv.org/abs/<arxiv-id>`
- PDF URL: `https://arxiv.org/pdf/<arxiv-id>.pdf`
