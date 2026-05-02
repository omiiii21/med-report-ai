import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Upload } from './components/Upload';
import { KeyDialog } from './components/KeyDialog';
import { ConfidenceBanner } from './components/ConfidenceBanner';
import { DualView } from './components/DualView';
import { StatusOverlay } from './components/StatusOverlay';
import { extractText } from './lib/parse';
import { analyzeReport, DEFAULT_MODELS, PROVIDER_LABELS, type Provider } from './lib/llm';
import { ReportAnalysis } from './lib/schema';
import {
  getProvider,
  setProvider,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  clearApiKey,
  getActiveCredentials,
} from './lib/storage';

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
  const [activeProvider, setActiveProvider] = useState<Provider>('openrouter');
  const [hasActiveKey, setHasActiveKey] = useState(false);

  const refreshCredsFlag = useCallback(() => {
    const provider = getProvider();
    setActiveProvider(provider);
    setHasActiveKey(!!getApiKey(provider));
  }, []);

  useEffect(() => {
    refreshCredsFlag();
  }, [refreshCredsFlag]);

  const reset = useCallback(() => {
    setState({ kind: 'idle' });
    setSelectedIdx(null);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setSelectedIdx(null);

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

    const creds = getActiveCredentials();
    if (!creds) {
      setState({
        kind: 'error',
        message:
          'No API key configured. Open Settings to add one (OpenRouter or Google Gemini), or click "Try sample report" on the home screen for a no-key demo.',
      });
      return;
    }

    setState({ kind: 'analyzing' });
    try {
      const result = await analyzeReport(raw, {
        provider: creds.provider,
        apiKey: creds.apiKey,
        model: creds.model || DEFAULT_MODELS[creds.provider],
      });
      setState({
        kind: 'ready',
        raw,
        analysis: result.analysis,
        parseMs,
        llmMs: result.llmMs,
        demoMode: false,
        model: `${PROVIDER_LABELS[result.provider]} · ${result.model}`,
      });
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
    }
  }, []);

  const handleTrySample = useCallback(async () => {
    setSelectedIdx(null);

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

    const creds = getActiveCredentials();
    if (creds) {
      setState({ kind: 'analyzing' });
      try {
        const result = await analyzeReport(raw, {
          provider: creds.provider,
          apiKey: creds.apiKey,
          model: creds.model || DEFAULT_MODELS[creds.provider],
        });
        setState({
          kind: 'ready',
          raw,
          analysis: result.analysis,
          parseMs,
          llmMs: result.llmMs,
          demoMode: false,
          model: `${PROVIDER_LABELS[result.provider]} · ${result.model}`,
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

  const handleSaveKey = useCallback(
    (provider: Provider, key: string, model: string) => {
      setProvider(provider);
      setApiKey(provider, key);
      setModel(provider, model);
      setKeyDialogOpen(false);
      refreshCredsFlag();
    },
    [refreshCredsFlag]
  );

  const handleClearKey = useCallback(
    (provider: Provider) => {
      clearApiKey(provider);
      refreshCredsFlag();
    },
    [refreshCredsFlag]
  );

  const hasReport = state.kind === 'ready';

  return (
    <div className="flex min-h-full flex-col">
      <Header
        onOpenSettings={() => setKeyDialogOpen(true)}
        onReset={reset}
        hasReport={hasReport}
        apiKeyPresent={hasActiveKey}
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
        initialProvider={activeProvider}
        getKeyFor={(p) => getApiKey(p) ?? ''}
        getModelFor={(p) => getModel(p) ?? ''}
        onSave={handleSaveKey}
        onClear={handleClearKey}
        onClose={() => setKeyDialogOpen(false)}
      />
    </div>
  );
}
