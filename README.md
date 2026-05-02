# Patient Report Simplifier

A lightweight, **explainable** medical-report viewer. Upload a lab report (PDF / DOCX / TXT) and get a ranked list of structured findings with **click-to-trace** source linkage — every AI insight is anchored to the exact snippet of the original report it came from.

**Live demo:** deployed on Vercel — see your project's Vercel dashboard for the URL (`https://<project>.vercel.app`).

> The deployed site ships with a precomputed analysis for a sample report, so you can explore the full UX without an API key. To analyze your own report, paste an OpenRouter key in Settings.

---

## What it does

- **Parses** PDFs (text-based), DOCX, and TXT entirely in the browser — files never leave your device.
- **Calls an LLM** (via OpenRouter, OpenAI-compatible) with a strict JSON contract.
- **Validates** the response with a zod schema before anything is rendered.
- **Highlights** the source snippet in the raw report whenever you click a finding card. Highlighting falls back to a whitespace-tolerant match when the LLM's snippet differs slightly from the extracted text.

The contract requires every finding's `source_snippet` to be a **verbatim substring** of the input. Findings that can't be traced back are dropped (or flagged) rather than hallucinated.

---

## Stack

- React 18 · TypeScript · Vite · Tailwind CSS v3
- `pdfjs-dist` for PDF text extraction (with a private-use-glyph fallback for some Indian lab-report PDFs)
- `mammoth` for DOCX
- `zod` for response schema validation
- OpenRouter (`response_format: json_object`) — bring-your-own-key
- Static deploy on Vercel

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

To analyze a real report you'll need an OpenRouter API key (https://openrouter.ai/keys). Open **Settings** in the app and paste it in. The key is stored in `sessionStorage` and is cleared when you close the tab.

### Regenerate the sample analysis

```bash
# PowerShell
$env:OPENROUTER_API_KEY="sk-or-..."; npm run precompute

# bash
OPENROUTER_API_KEY=sk-or-... npm run precompute
```

This runs the same prompt the app uses against `public/sample-report.pdf` and writes `public/sample-analysis.json`, which is what visitors see in demo mode.

---

## Project layout

```
src/
  components/    UI (Header, Upload, KeyDialog, DualView, RawPanel, InsightsPanel, ConfidenceBanner, StatusOverlay)
  lib/
    parse.ts     pdf/docx/txt extraction (browser)
    prompts.ts   system prompt — verbatim source_snippet contract
    schema.ts    zod ReportAnalysis schema
    llm.ts       OpenRouter chat completions + retry
    highlight.ts substring + whitespace-tolerant locate, span builder
    storage.ts   sessionStorage helpers for the API key
scripts/
  extract-sample.ts     prints the extracted PDF text to scripts/sample-extracted.txt
  precompute-sample.ts  regenerates public/sample-analysis.json
public/
  sample-report.pdf     bundled demo input
  sample-analysis.json  precomputed demo output (no key required)
vercel.json             framework + caching config for Vercel
```

---

## Deploying your own fork

**Vercel (recommended):**
1. Fork or clone, push to your GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Vercel auto-detects Vite from `vercel.json`.
3. Click Deploy. Done — every push to `main` ships automatically.

**Vercel CLI alternative:**
```bash
npx vercel        # first run links the repo and deploys to a preview URL
npx vercel --prod # promotes to production
```

---

## What this is not

- Not medical advice. Not a diagnostic tool. Not a substitute for talking to a clinician.
- No longitudinal tracking, no doctor workflow, no chat interface. See the [PRD](patient_report_simplifier_prd.md) for non-goals.
- OCR for scanned/image-only PDFs is out of scope for this version.
