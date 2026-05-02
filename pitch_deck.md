# Patient Report Simplifier — Pitch Deck

> **Format:** one slide per H2. Each slide has a *Title*, *On-screen content*, *Speaker notes*, and a *Visual* hint.
> **Total time:** 3–4 minutes (hackathon pitch). Demo lives at slide 6.
> **Live demo URL:** https://omiiii21.github.io/med-report-ai/
> **Repo:** https://github.com/omiiii21/med-report-ai

---

## Slide 1 — Title / Hook

**Title (large):** Patient Report Simplifier
**Subtitle:** Your lab report, decoded — and every AI claim shows its work.

**On-screen:**
- Tagline: *Highlight what matters. Explain why. Show exactly where it came from.*
- Tiny line: live demo url

**Speaker notes (15s):**
> "Imagine getting a six-page lab report full of acronyms — hsCRP, Apo B, HbA1c — and asking an AI to summarize it. Today's AI tools will give you a confident-sounding summary. But how do you know it didn't make something up? We built Patient Report Simplifier to fix exactly that — every insight links back to the line in your report it came from."

**Visual:** Big bold title. One screenshot of the dual-view UI behind it, slightly blurred for backdrop.

---

## Slide 2 — The Problem

**Title:** Patients drown in clinical jargon. AI summaries make it worse.

**On-screen (3 bullets):**
- A typical lab report has **30+ values, 6+ pages, and zero plain-English context.**
- Patients can't tell which numbers matter, or what "borderline" actually means.
- LLM summarizers hallucinate. Their output looks confident — but you can't verify it without re-reading the whole report.

**Speaker notes (30s):**
> "Three problems stack on top of each other. First, raw reports are dense — most of the words are units, ranges, and disclaimers. Second, the meaningful information is buried — out of dozens of numbers, maybe three matter. Third, today's AI fixes are worse than the disease: they generate confident summaries with no way to check them. If the model says 'your iron is low' but it actually misread the value, you have no way to catch it. That's a trust problem, and in healthcare, trust is everything."

**Visual:** Side-by-side: left = a screenshot of a real, busy lab report (your sample). Right = a generic chat AI saying "You appear to have anemia." with a red warning sticker over it: *"How do you know?"*

---

## Slide 3 — Why It Matters Now

**Title:** This isn't a niche pain.

**On-screen (3 stats / claims):**
- ~**2 billion** lab tests are run in the US alone every year.
- ~**1 in 3** patients say they don't understand their results.
- LLMs are now smart enough to interpret reports — **but only if patients can trust the output.**

**Speaker notes (25s):**
> "Lab testing is one of the highest-volume diagnostic activities in medicine. Patients increasingly get their results pushed straight to a portal with no doctor in the loop. Surveys consistently show that a third or more of patients can't make sense of what they're looking at. AI is a great answer in principle — but only if we can solve the hallucination problem. That's the gap we fill."

**Visual:** Three large numbers, no chart junk. Stat → punchline format.

> *Note: replace these stats with figures you can cite if you have time. The point of the slide is "real, large pain" — exact numbers are less important than directionally true.*

---

## Slide 4 — The Solution (One-Liner)

**Title:** An explainable report viewer with click-to-trace AI insights.

**On-screen:**
- Upload report → AI extracts the 5 most-important findings → click any finding to see the **exact source line** highlighted in your original report.
- Three principles: **traceability first**, **conservative language**, **clarity over completeness**.

**Speaker notes (20s):**
> "Our pitch is one sentence: every AI insight is one click from its source. We don't try to replace doctors. We don't give diagnoses. We surface the few values that actually matter, explain them in plain English, and prove our work by linking every claim back to the verbatim line in your report."

**Visual:** A single annotated screenshot: left panel showing raw report with one line highlighted in amber, right panel showing the corresponding finding card with an arrow pointing left.

---

## Slide 5 — How It Works

**Title:** Four stages, fully in your browser.

**On-screen (linear diagram):**

```
1. UPLOAD          2. PARSE             3. INTERPRET           4. TRACE
   PDF/DOCX/TXT  →  pdf.js + mammoth  →  LLM (OpenRouter)   →  Click-to-source
   in browser       extract text         strict JSON schema     verbatim match
                                         + zod validation
```

**Speaker notes (25s):**
> "The whole pipeline runs in the browser — no backend, no data ever leaves the user's device. We extract text with pdf.js. We send it to a frontier LLM via OpenRouter with a strict JSON schema. Two engineering tricks make this work: one, the model is required to return a `source_snippet` that is a *verbatim* substring of the input — paraphrasing is rejected. Two, our highlighter does an exact match first, then a whitespace-tolerant fuzzy match, so even if the model normalizes spaces we still resolve the source line."

**Visual:** Four-stage horizontal pipeline. Lab icons. Arrows. Keep it bold and minimal — no UML.

---

## Slide 6 — Live Demo (Center of the pitch)

**Title:** Demo

**On-screen:** Just the URL and a QR code that resolves to it.

**Speaker notes (60s) — rehearse this exact flow:**
> 1. *(Click "Try sample report")* "This is a real heart-health screen — six pages, dozens of acronyms."
> 2. *(Show parsing finish)* "It parsed in under a second, entirely client-side."
> 3. *(Point to confidence banner)* "We see 5 findings. 'Demo · precomputed' tag — this works without an API key, but the same pipeline runs live with one."
> 4. *(Point to the top finding)* "hsCRP is sitting right at the boundary between low and average cardiovascular risk. Plain-English explanation. No diagnosis."
> 5. *(Click 'Show source')* "And here's the kill shot — that finding is now highlighted in the original report. I can see the exact line: hsCRP value, units, reference range. Nothing was made up."
> 6. *(Click another card to swap highlight)* "Switch findings — highlight follows. Every claim is verifiable in one click."

**Visual:** Live demo. Have it pre-loaded in another window, ready to alt-tab to. Backup: a 30-second screen recording embedded as a fallback.

---

## Slide 7 — Why This Wins

**Title:** What we do differently.

**On-screen (comparison row):**

| | Generic ChatGPT summary | Patient portals (Quest, etc.) | **Patient Report Simplifier** |
|---|---|---|---|
| Plain-language explanation | Yes | No | **Yes** |
| Ranked by clinical relevance | Sometimes | No | **Yes** |
| Verbatim source linkage | **No** | N/A | **Yes** |
| Works on any report (not just one lab) | Yes | No | **Yes** |
| Conservative / non-diagnostic | No | N/A | **Yes** |

**Speaker notes (25s):**
> "Two categories exist today: the patient portals from labs themselves, which are essentially raw data, and general AI tools, which are confident black boxes. We sit in between — the readability of an AI tool with the auditability of the original report. The verbatim source linkage row is our moat. Nobody else is doing it because it requires giving up some flexibility in the prompt — and that tradeoff is exactly the right one for healthcare."

**Visual:** Clean comparison table. Highlight the "Verbatim source linkage" row.

---

## Slide 8 — Tech & Trust

**Title:** Built for trust.

**On-screen (three columns):**

- **Privacy by default**
  Files never leave the browser. No backend. No database. Your OpenRouter key lives in `sessionStorage` and is wiped when the tab closes.
- **Schema-validated AI**
  Every LLM response is parsed by a `zod` schema before rendering. Invalid responses trigger a single deterministic retry, then fail loudly.
- **Demo without a key**
  The deployed site ships a precomputed analysis for the sample report so reviewers can experience the full UX with zero setup.

**Speaker notes (20s):**
> "Healthcare data is sensitive, so we made an architectural choice: no server. Everything runs in your browser — parsing, LLM call, rendering. The only network request is to OpenRouter, with a key the user controls. On the AI side, we treat the model output as untrusted: zod validates the schema, and the verbatim-source contract is enforced post-hoc — findings that can't be traced get dropped."

**Visual:** Three icons (lock, shield, play button). Plain. No buzzwords on the slide.

---

## Slide 9 — Risks & Mitigations

**Title:** What could go wrong, and what we did about it.

**On-screen (table):**

| Risk | Mitigation |
|---|---|
| LLM hallucinates a finding | Verbatim `source_snippet` contract; findings without a match are dropped |
| OCR-quality input degrades extraction | We **already handle** PDFs that use Private Use Area glyphs (common in Indian lab reports); OCR for scanned PDFs is on the roadmap |
| Misinterpretation of reference ranges | Conservative language; we never claim a diagnosis; ranges are shown verbatim |
| Bundle weight / first-load latency | Precomputed demo eliminates LLM latency for first-time visitors |

**Speaker notes (20s):**
> "Every risk that mattered, we either solved or scoped explicitly. The verbatim contract makes hallucination drop visibly — instead of silently. We already shipped a fix for a real-world PDF encoding quirk that broke off-the-shelf parsers. And the demo mode means a judge sees the full UX in five seconds, even on a flaky conference Wi-Fi."

**Visual:** Two-column table. Don't read it line by line — let it sit while you talk.

---

## Slide 10 — What's Next

**Title:** Roadmap.

**On-screen (3 bullets, ordered):**

1. **OCR for scanned reports** — most older reports are images, not text PDFs.
2. **Multi-report comparison** — track a metric across visits without exposing PHI server-side.
3. **Doctor-facing summary** — same engine, different prompt: a one-paragraph "what changed" view for clinicians.

**Speaker notes (15s):**
> "We deliberately scoped this MVP narrow. The traceability primitive we built generalizes well — once you have verbatim source linkage on a single report, multi-report comparison and doctor-facing summaries are prompt swaps, not architectural rewrites."

**Visual:** Three-step roadmap, no dates. Keep the focus on direction, not deadlines.

---

## Slide 11 — Team & Ask

**Title:** Try it. Then tell us what to build next.

**On-screen:**
- Live demo URL (large)
- Repo URL
- Team names + roles
- One sentence: *"We're looking for [feedback / a healthcare design partner / mentor connections] — find us at [booth/table]."*

**Speaker notes (15s):**
> "The demo is live right now — scan the QR code, try the sample, then upload your own report and bring your own OpenRouter key. We're here for the rest of the day. Tell us what's missing. Thank you."

**Visual:** Big QR code linking to the demo. Repo URL underneath. Team photo (optional). One clear ask sentence.

---

## Slide 12 — Backup / Q&A buffer

**Title:** Questions?

**On-screen:** *blank or repeat title slide*

**Likely questions and crisp answers:**

- **"Why not just call OpenAI directly?"**
  OpenRouter lets users bring any key — Anthropic, OpenAI, local — without us locking them in. Same JSON-mode contract.
- **"What about HIPAA?"**
  Files never leave the browser; we don't operate a covered entity. We're not a clinical tool — that's stated on every screen. For an actual product, we'd add a BAA-covered LLM provider behind a backend; the architecture is ready.
- **"How do you stop the model from giving advice?"**
  Conservative-language rules in the system prompt + post-hoc filter on phrases. We chose to drop ambiguous findings rather than ship them.
- **"What happens on a totally garbage PDF?"**
  Empty extraction triggers a clear "OCR not supported in this version" message. We don't pretend.
- **"How long did this take?"**
  Built end-to-end during this hackathon. Repo has the full commit history.

---

## Speaker delivery cheat sheet

- **Timing target:** Slide 1 (15s) → 2 (30s) → 3 (25s) → 4 (20s) → 5 (25s) → 6 (60s, demo) → 7 (25s) → 8 (20s) → 9 (20s) → 10 (15s) → 11 (15s). Total ≈ 4:30.
- **Voice:** confident, not salesy. Don't oversell — the verbatim-source linkage *is* the differentiator; let it carry the weight.
- **Body:** stand to the right of the screen so judges see the demo unobstructed. Don't read from slides.
- **If demo breaks:** alt-tab to the screen-recorded backup. Acknowledge the rough edge once, then move on. Hackathon judges respect grace under pressure more than perfection.
- **Energy beats:** punch slide 2 ("hallucinate" → pause), slide 6 ("kill shot" moment when the highlight appears), slide 11 (clear ask, then stop talking).

---

## Notes for slide rendering

- Use a clean, neutral theme — no medical iconography overload, no stethoscope clip art. Slate / off-white background, one accent color (amber for the highlight metaphor).
- Mono font (`JetBrains Mono` / `IBM Plex Mono`) only for code or schema snippets; everything else is `Inter` / system sans.
- One idea per slide. If a slide has more than 5 lines of text, split it.
