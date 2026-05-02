import { useMemo } from 'react';
import type { TestFinding } from '../lib/schema';
import { PRIORITY_RANK } from '../lib/schema';

type Props = {
  findings: TestFinding[];
  located: boolean[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
};

export function InsightsPanel({ findings, located, selectedIdx, onSelect }: Props) {
  const order = useMemo(() => {
    return findings
      .map((f, i) => ({ f, i }))
      .sort((a, b) => PRIORITY_RANK[a.f.priority] - PRIORITY_RANK[b.f.priority]);
  }, [findings]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">AI insights</h2>
          <p className="text-[11px] text-slate-500">
            {findings.length} finding{findings.length === 1 ? '' : 's'} · click "Show source" to trace
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        {findings.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No structured findings detected in this report.
          </div>
        ) : (
          <ul className="space-y-3">
            {order.map(({ f, i }) => (
              <FindingCard
                key={i}
                f={f}
                idx={i}
                selected={selectedIdx === i}
                located={located[i]}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FindingCard({
  f,
  idx,
  selected,
  located,
  onSelect,
}: {
  f: TestFinding;
  idx: number;
  selected: boolean;
  located: boolean;
  onSelect: (i: number) => void;
}) {
  const priorityClass =
    f.priority === 'high'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : f.priority === 'medium'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const statusClass =
    f.status === 'high' || f.status === 'low' || f.status === 'abnormal'
      ? 'bg-rose-50 text-rose-700'
      : f.status === 'normal'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-slate-50 text-slate-600';

  return (
    <li
      className={
        'rounded-lg border bg-white p-4 transition-shadow ' +
        (selected ? 'border-slate-900 shadow-md ring-1 ring-slate-900' : 'border-slate-200 hover:shadow-sm')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{f.name}</h3>
            <span
              className={
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ' +
                priorityClass
              }
            >
              {f.priority}
            </span>
            <span
              className={
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ' +
                statusClass
              }
            >
              {f.status}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span className="font-mono">{f.value || '—'}</span>
            {f.units ? <span className="ml-1">{f.units}</span> : null}
            {f.range ? <span className="ml-2">Ref: <span className="font-mono">{f.range}</span></span> : null}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-800">{f.finding}</p>
      <p className="mt-1 text-sm text-slate-600">{f.explanation}</p>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!located}
          onClick={() => onSelect(idx)}
          className={
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ' +
            (located
              ? selected
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400')
          }
          title={located ? 'Highlight the source snippet on the left' : 'Source could not be located in the raw report'}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path
              d="M4 6h16M4 12h10M4 18h16"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {selected ? 'Showing source' : 'Show source'}
        </button>
        {!located && (
          <span className="text-[10px] text-slate-400">source not located</span>
        )}
      </div>
    </li>
  );
}
