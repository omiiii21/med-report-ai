# Frontend Generation Prompt — Patient Report Simplifier

> Paste this into v0.dev / Lovable / Bolt / Cursor / Claude Artifacts to generate a UI that is **drop-in compatible** with the existing parsing + LLM + highlight engine. The component file paths, prop names, and types below are the contract — match them exactly and the generated UI plugs in without code changes.

---

## 1. Product

**Patient Report Simplifier** — a single-page web app that turns raw medical lab reports (PDF / DOCX / TXT) into structured, ranked findings with **click-to-trace** source linkage. The user uploads a report; the app parses it client-side, sends the text to an LLM via OpenRouter, and renders a **two-column view**: original report on the left (with highlighted spans), AI insights on the right (ranked cards). Clicking a card highlights the exact source snippet on the left and scrolls it into view.

**Primary user**: a non-medical patient. Tone must be calm, plain-language, and conservative. Never diagnostic.

**Persistent disclaimer** (always visible somewhere prominent): *"AI-generated interpretation. Based on a single report. Not medical advice."*

---

## 2. Tech & constraints

- **React 18 + TypeScript + Vite + Tailwind CSS v3** — no other UI libraries unless cited below.
- Allowed icon options: inline SVGs **OR** `lucide-react` (add to `package.json` if you use it).
- **No** routing, **no** Redux/Zustand, **no** server. State lives in `useState`/`useRef` in `App.tsx`.
- All components must be functional, typed, and use Tailwind utility classes only (no CSS-in-JS, no styled-components).
- Tailwind config already exists with `content: ['./index.html', './src/**/*.{ts,tsx}']`.
- Build target: static site deployed to GitHub Pages at `https://omiiii21.github.io/med-report-ai/`.

---

## 3. Visual direction

- **Aesthetic**: clean, clinical-but-warm. Think Linear / Vercel dashboard meets a calming health app.
- **Palette**: neutral slate base (`bg-slate-50` page, `bg-white` cards, `text-slate-900` body). Accent: subtle emerald for "good", amber for "borderline", rose for "abnormal/high priority". Avoid bright reds.
- **Typography**: system-ui sans for UI, monospace for raw report text and lab values.
- **Density**: generous whitespace; rounded-lg cards; soft shadows (`shadow-sm`).
- **Highlights** (raw report panel): inactive matches use `bg-amber-100`, the actively-selected snippet uses `bg-amber-300` with a `ring-2 ring-amber-700` outline — these class names are referenced from `index.css` so don't rename the `hl` / `hl-active` CSS classes.

---

## 4. Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]  Patient Report Simplifier                  [New report] [⚙] │
│         "AI-generated interpretation. Not medical advice."          │
├─────────────────────────────────────────────────────────────────────┤
│  [Confidence banner: summary + 0–100% bar + parse/llm timings]      │
├──────────────────────────────────┬──────────────────────────────────┤
│ Original report                  │ AI insights                      │
│ ──────────────────               │ ──────────────────               │
│ Raw text with                    │ ┌─────────────────────────────┐  │
│ highlighted spans                │ │ Hemoglobin       [HIGH][LOW]│  │
│ Click span → selects card        │ │ 10.2 g/dL · Ref 13–17       │  │
│ Active span = brighter color     │ │ Below normal range          │  │
│ + scrolled into view             │ │ May indicate anemia.        │  │
│                                  │ │ [Show source]               │  │
│ (scrollable)                     │ └─────────────────────────────┘  │
│                                  │ ...more cards sorted by priority │
└──────────────────────────────────┴──────────────────────────────────┘
│ Footer: short reminder this is not medical advice                   │
└─────────────────────────────────────────────────────────────────────┘
```

- Desktop (≥`lg`): two columns side-by-side, each panel `max-h-[70vh] overflow-auto`.
- Mobile: stack vertically, raw panel collapsible.
- Idle state (no report yet): replace the dual view with an upload zone (drag-drop + "Choose file" + "Try sample report" buttons + supported-formats note).
- Loading states: subtle, animated indicator. Don't block the whole screen.

---

## 5. Components to produce

Place each in `src/components/<Name>.tsx`. **Match these exact filenames, exports, and prop signatures.** Imports below reference real files in this repo.

### `Header.tsx`
```ts
type Props = {
  onOpenSettings: () => void;
  onReset: () => void;
  hasReport: boolean;
  apiKeyPresent: boolean;          // green dot when true, gray dot when false
};
export function Header(props: Props): JSX.Element;
```

### `Upload.tsx`
```ts
type Props = {
  onFile: (file: File) => void;     // user picked or dropped a file
  onTrySample: () => void;          // user clicked "Try sample report"
  busy: boolean;                    // disable buttons while parsing/analyzing
};
export function Upload(props: Props): JSX.Element;
```
Accept: `.pdf, .docx, .txt`. Show a hint that OCR is not supported.

### `KeyDialog.tsx`
```ts
type Props = {
  open: boolean;
  initialKey: string;
  initialModel: string;
  onSave: (key: string, model: string) => void;
  onClear: () => void;
  onClose: () => void;
};
export function KeyDialog(props: Props): JSX.Element | null;
```
Modal centered overlay. Inputs: API key (password with show/hide toggle), model (text). Inline notice: *"Your key is sent directly to OpenRouter from your browser. Stored in sessionStorage and cleared when the tab closes."* Default model from `import { DEFAULT_MODEL } from '../lib/llm';`.

### `ConfidenceBanner.tsx`
```ts
type Props = {
  summary: string;
  confidence: number;     // 0..1
  parseMs: number;
  llmMs: number;          // 0 in demo mode
  demoMode: boolean;      // show "Demo · precomputed" pill
  model: string | null;
};
export function ConfidenceBanner(props: Props): JSX.Element;
```

### `RawPanel.tsx`
```ts
import type { TestFinding } from '../lib/schema';
type Props = {
  raw: string;
  findings: TestFinding[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
};
export function RawPanel(props: Props): JSX.Element;
```
Use `buildSpans(raw, findings, selectedIdx)` from `'../lib/highlight'` to render the text. **Do not use `dangerouslySetInnerHTML`** — render each span as a `<span>` or `<mark>` React node. The active mark must have `data-active="true"` and an effect that scrolls it into view via `scrollIntoView({ block: 'center', behavior: 'smooth' })`. Clicking any highlighted mark calls `onSelect(span.findingIdx)`.

### `InsightsPanel.tsx`
```ts
import type { TestFinding } from '../lib/schema';
type Props = {
  findings: TestFinding[];
  located: boolean[];        // same length as findings; false ⇒ "Show source" disabled
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
};
export function InsightsPanel(props: Props): JSX.Element;
```
Sort by priority using `import { PRIORITY_RANK } from '../lib/schema'`. Each card shows: name, priority pill, status pill, value+units+range row, the `finding` (one-line bold), the `explanation` (1–2 sentences), and a "Show source" button. Selected card = stronger border + ring. If `located[idx]` is false, disable the button with a tooltip *"Source could not be located in the raw report"*.

### `DualView.tsx`
```ts
import type { ReportAnalysis } from '../lib/schema';
type Props = {
  raw: string;
  analysis: ReportAnalysis;
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
};
export function DualView(props: Props): JSX.Element;
```
Wraps `RawPanel` + `InsightsPanel` in a responsive 2-column grid. Compute `located` once via `import { locatedFindings } from '../lib/highlight';` and pass to `InsightsPanel`.

### `StatusOverlay.tsx`
```ts
type Props = {
  kind: 'parsing' | 'analyzing' | 'error';
  message?: string;
  fileName?: string;
  onDismiss?: () => void;
};
export function StatusOverlay(props: Props): JSX.Element;
```

---

## 6. Data shape (the LLM output your UI renders)

```ts
// src/lib/schema.ts (already exists — import these types, don't redefine)
type Status = 'low' | 'normal' | 'high' | 'abnormal' | 'unknown';
type Priority = 'high' | 'medium' | 'low';

type TestFinding = {
  name: string;                    // e.g. "Hemoglobin"
  value: string;                   // e.g. "10.2"
  range?: string | null;           // e.g. "13-17"
  units?: string | null;           // e.g. "g/dL"
  status: Status;
  priority: Priority;
  finding: string;                 // ≤ 8 words headline
  explanation: string;             // ≤ 2 sentences plain-language
  source_snippet: string;          // verbatim substring of `raw`
};

type ReportAnalysis = {
  tests: TestFinding[];            // up to 5
  summary: string;                 // ≤ 2 sentences
  confidence: number;              // 0..1
};
```

A complete sample payload (use this for design-time fixtures):
```json
{
  "tests": [
    {
      "name": "hsCRP (Cardio C-Reactive Protein)",
      "value": "1.00",
      "range": "<1.00",
      "units": "mg/L",
      "status": "abnormal",
      "priority": "medium",
      "finding": "Slightly above low-risk threshold",
      "explanation": "hsCRP measures inflammation linked to cardiovascular risk. A value of 1.00 mg/L sits at the boundary between low and average risk.",
      "source_snippet": "CARDIO C-REACTIVE PROTEIN (hsCRP), SERUM     1.00     mg/L     <1.00"
    },
    {
      "name": "Apolipoprotein B (Apo B)",
      "value": "46.00",
      "range": "46 - 174",
      "units": "mg/dL",
      "status": "normal",
      "priority": "low",
      "finding": "At the lower end of the reference range",
      "explanation": "Apo B reflects atherogenic particles. This result is within the printed reference range.",
      "source_snippet": "APOLIPOPROTEIN B (Apo B)     46.00     mg/dL     46 - 174"
    }
  ],
  "summary": "Two complete results: hsCRP at the low/average risk boundary; Apo B at the low end of normal. Several other panel results are pending.",
  "confidence": 0.62
}
```

---

## 7. App.tsx state machine (already implemented — match this contract)

```ts
type AppState =
  | { kind: 'idle' }
  | { kind: 'parsing'; fileName: string }
  | { kind: 'analyzing' }
  | {
      kind: 'ready';
      raw: string;
      analysis: ReportAnalysis;
      parseMs: number;
      llmMs: number;
      demoMode: boolean;
      model: string | null;
    }
  | { kind: 'error'; message: string };
```
- `selectedIdx: number | null` — clicking the same card twice unselects.
- API key: `getApiKey()` / `setApiKey()` from `'./lib/storage'` (sessionStorage). Model from `getModel()` / `setModel()` (localStorage).
- "Try sample" flow: fetch `${import.meta.env.BASE_URL}sample-report.pdf` → parse → if API key, call `analyzeReport`; else fetch `${import.meta.env.BASE_URL}sample-analysis.json` for demo mode.

---

## 8. Out of scope
- No login, no accounts, no payment.
- No Server Components, no Next.js — Vite SPA only.
- No file persistence — everything stays in memory.
- No multi-report comparison, no chat interface, no doctor workflow.

---

## 9. Acceptance checklist
- [ ] All 8 components above exist at the listed paths with the listed prop signatures.
- [ ] `App.tsx` state machine kinds and transitions match section 7.
- [ ] Raw text is rendered as React nodes (no `dangerouslySetInnerHTML`).
- [ ] Active highlight uses `data-active="true"` and scrolls into view.
- [ ] Mobile (≤`md`) stacks the two panels; desktop shows them side-by-side.
- [ ] No new dependencies beyond `react`, `react-dom`, `pdfjs-dist`, `mammoth`, `zod`, `lucide-react` (optional).
- [ ] Persistent disclaimer is visible.
- [ ] Empty / error / loading states are handled (use `StatusOverlay` for parsing/analyzing/error).
