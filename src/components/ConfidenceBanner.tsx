type Props = {
  summary: string;
  confidence: number;
  parseMs: number;
  llmMs: number;
  demoMode: boolean;
  model: string | null;
};

export function ConfidenceBanner({ summary, confidence, parseMs, llmMs, demoMode, model }: Props) {
  const pct = Math.round(confidence * 100);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ' +
                (demoMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
              }
            >
              {demoMode ? 'Demo · precomputed' : 'Live · AI-generated'}
            </span>
            <span className="text-xs text-slate-500">
              Parsed in {Math.round(parseMs)}ms
              {!demoMode && llmMs > 0 ? ` · Analyzed in ${(llmMs / 1000).toFixed(1)}s` : ''}
              {model ? ` · ${model}` : ''}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-800">{summary}</p>
        </div>
        <div className="w-full sm:w-48">
          <div className="flex items-baseline justify-between text-xs text-slate-500">
            <span>Confidence</span>
            <span className="font-mono text-slate-900">{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={
                'h-full rounded-full ' +
                (pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500')
              }
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
