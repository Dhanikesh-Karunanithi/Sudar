# Research paper — ALP / Adaptive Learning Layer

This folder contains the scientific paper draft and submission materials for the AI-native learning platform and plugin architecture (ALP) work.

## Paper

- **Title:** From Course Hosting to Adaptive Learning: An AI-Native Platform and Plugin Architecture for Learner Memory and Multimodal Delivery  
- **Technology name in paper:** Adaptive Learning Layer (ALP) for the plugin architecture; reference implementation: Sudar (canonical repository: https://github.com/Dhanikesh-Karunanithi/Sudar).  
- **File:** [paper.tex](paper.tex) — LaTeX source (two-column, ~8–10 pages).  
- **Published PDF (v4):** [Sudar_LAMP_Paper_v4.pdf](Sudar_LAMP_Paper_v4.pdf) — author-compiled snapshot aligned with the Sudar / LAMP workstream.  
- **References:** [references.bib](references.bib) — BibTeX.

## Build

Requires a TeX distribution (e.g. TeX Live, MiKTeX). From this directory:

```bash
pdflatex paper
bibtex paper
pdflatex paper
pdflatex paper
```

## Get the PDF and submit to arXiv

See **[GET_PDF_AND_ARXIV.md](GET_PDF_AND_ARXIV.md)** for:
- How to build the PDF (Overleaf, no install, or local TeX).
- Step-by-step browser instructions to publish on arXiv.

## Submission (reference)

See [ARXIV_SUBMISSION.md](ARXIV_SUBMISSION.md) for:

- How to build the PDF and prepare the submission package  
- Suggested arXiv categories (cs.CY, cs.HC, cs.LG, cs.AI)  
- Venue options after arXiv (AIED, EDM, L@S, CHI, LAK; IJAIED, Computers & Education, etc.)

## Figures

Figures are drawn in TikZ inside `paper.tex`. For higher-quality or custom figures, see [figures/README.md](figures/README.md).

## Call for collaboration

The paper includes a call for institutions and organizations to collaborate on pilots and plugin integrations. Contact and repo: [github.com/Dhanikesh-Karunanithi/Sudar](https://github.com/Dhanikesh-Karunanithi/Sudar).
