import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Upload } from './components/Upload';
import { KeyDialog } from './components/KeyDialog';
import { ConfidenceBanner } from './components/ConfidenceBanner';
import { DualView } from './components/DualView';
import { StatusOverlay } from './components/StatusOverlay';
import { extractText } from './lib/parse';
import { analyzeReport, DEFAULT_MODEL } from './lib/llm';
import { ReportAnalysis } from './lib/schema';
import { getApiKey, setApiKey, getModel, setModel, clearApiKey } from './lib/storage';

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

const SAMPLE_PDF = `${import.meta.env.BASE_URL}sample-report.pdf`;
const SAMPLE_ANALYSIS = `${import.meta.env.BASE_URL}sample-analysis.json`;

export default function App() {
  const [state, setState] = useState<AppState>({ kind: 'idle' });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [model, setModelState] = useState<string>(DEFAULT_MODEL);

  useEffect(() => {
    setApiKeyState(getApiKey() ?? '');
    setModelState(getModel() ?? DEFAULT_MODEL);
  }, []);

  const reset = useCallback(() => {
    setState({ kind: 'idle' });
    setSelectedIdx(null);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setSelectedIdx(null);

      // 1. Parse.
      setState({ kind: 'parsing', fileName: file.name });
      let raw: string;
      let parseMs: number;
      try {
        const r = await extractText(file);
        raw = r.text;
        parseMs = r.parseMs;
      } catch (e) {
        setState({ kind: 'error', message: (e as Error).message });
        return;
      }

      if (!raw || raw.trim().length === 0) {
        setState({
          kind: 'error',
          message:
            "Couldn't extract any text from this file. If it's a scanned/image-only PDF, OCR is not supported in this version. Try a text-based PDF, a DOCX, or paste the text into a .txt file.",
        });
        return;
      }

      // 2. Analyze with LLM (if key) or fail with helpful message.
      const key = getApiKey();
      if (!key) {
        setState({
          kind: 'error',
          message:
            'No OpenRouter API key configured. Open Settings to add one, or click "Try sample report" on the home screen for a no-key demo.',
        });
        return;
      }

      setState({ kind: 'analyzing' });
      try {
        const result = await analyzeReport(raw, { apiKey: key, model: getModel() ?? DEFAULT_MODEL });
        setState({
          kind: 'ready',
          raw,
          analysis: result.analysis,
          parseMs,
          llmMs: result.llmMs,
          demoMode: false,
          model: result.model,
        });
      } catch (e) {
        setState({ kind: 'error', message: (e as Error).message });
      }
    },
    []
  );

  const handleTrySample = useCallback(async () => {
    setSelectedIdx(null);

    // 1. Fetch sample PDF and parse it (so the raw view shows real extracted text).
    setState({ kind: 'parsing', fileName: 'sample-report.pdf' });
    let raw = '';
    let parseMs = 0;
    try {
      const pdfRes = await fetch(SAMPLE_PDF);
      if (!pdfRes.ok) throw new Error(`Could not fetch sample PDF (${pdfRes.status})`);
      const blob = await pdfRes.blob();
      const file = new File([blob], 'sample-report.pdf', { type: 'application/pdf' });
      const parsed = await extractText(file);
      raw = parsed.text;
      parseMs = parsed.parseMs;
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
      return;
    }

    // 2. If user has an API key, run live. Otherwise, load precomputed analysis.
    const key = getApiKey();
    if (key) {
      setState({ kind: 'analyzing' });
      try {
        const result = await analyzeReport(raw, { apiKey: key, model: getModel() ?? DEFAULT_MODEL });
        setState({
          kind: 'ready',
          raw,
          analysis: result.analysis,
          parseMs,
          llmMs: result.llmMs,
          demoMode: false,
          model: result.model,
        });
        return;
      } catch (e) {
        // Fall through to demo mode if live call fails.
        console.warn('Live analysis failed, falling back to demo mode:', e);
      }
    }

    try {
      const res = await fetch(SAMPLE_ANALYSIS);
      if (!res.ok) throw new Error(`Could not fetch sample analysis (${res.status})`);
      const json = await res.json();
      const parsed = ReportAnalysis.safeParse(json);
      if (!parsed.success) throw new Error('Sample analysis JSON failed schema validation.');
      setState({
        kind: 'ready',
        raw,
        analysis: parsed.data,
        parseMs,
        llmMs: 0,
        demoMode: true,
        model: null,
      });
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
    }
  }, []);

  const handleSaveKey = useCallback((key: string, m: string) => {
    setApiKey(key);
    setModel(m);
    setApiKeyState(key);
    setModelState(m);
    setKeyDialogOpen(false);
  }, []);

  const handleClearKey = useCallback(() => {
    clearApiKey();
    setApiKeyState('');
    setKeyDialogOpen(false);
  }, []);

  const hasReport = state.kind === 'ready';
  const busy = state.kind === 'parsing' || state.kind === 'analyzing';

  return (
    <div className="flex min-h-full flex-col">
      <Header
        onOpenSettings={() => setKeyDialogOpen(true)}
        onReset={reset}
        hasReport={hasReport}
        apiKeyPresent={!!apiKey}
      />

      <main className="flex-1">
        {state.kind === 'idle' && (
          <Upload onFile={handleFile} onTrySample={handleTrySample} busy={false} />
        )}
        {(state.kind === 'parsing' || state.kind === 'analyzing') && (
          <StatusOverlay
            kind={state.kind}
            fileName={state.kind === 'parsing' ? state.fileName : undefined}
          />
        )}
        {state.kind === 'error' && (
          <StatusOverlay kind="error" message={state.message} onDismiss={reset} />
        )}
        {state.kind === 'ready' && (
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <ConfidenceBanner
              summary={state.analysis.summary}
              confidence={state.analysis.confidence}
              parseMs={state.parseMs}
              llmMs={state.llmMs}
              demoMode={state.demoMode}
              model={state.model}
            />
            <DualView
              raw={state.raw}
              analysis={state.analysis}
              selectedIdx={selectedIdx}
              onSelect={(i) => setSelectedIdx((cur) => (cur === i ? null : i))}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-[11px] text-slate-500 sm:px-6">
          Patient Report Simplifier — explainable medical report viewer.{' '}
          <span className="font-medium text-slate-600">Not medical advice.</span> Always discuss results with a qualified clinician.
        </div>
      </footer>

      <KeyDialog
        open={keyDialogOpen}
        initialKey={apiKey}
        initialModel={model}
        onSave={handleSaveKey}
        onClear={handleClearKey}
        onClose={() => setKeyDialogOpen(false)}
      />

      {/* Avoid unused-busy lint warning if needed in future */}
      <span className="hidden">{busy ? '' : ''}</span>
    </div>
  );
}
