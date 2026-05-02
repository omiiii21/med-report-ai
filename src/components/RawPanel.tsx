import { useEffect, useRef } from 'react';
import { buildSpans } from '../lib/highlight';
import type { TestFinding } from '../lib/schema';

type Props = {
  raw: string;
  findings: TestFinding[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
};

export function RawPanel({ raw, findings, selectedIdx, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spans = buildSpans(raw, findings, selectedIdx);

  useEffect(() => {
    if (selectedIdx === null) return;
    const el = containerRef.current?.querySelector('[data-active="true"]');
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedIdx]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Original report</h2>
          <p className="text-[11px] text-slate-500">Highlighted spans link back from each AI finding</p>
        </div>
      </header>
      <div
        ref={containerRef}
        className="raw-text flex-1 overflow-auto p-4 text-slate-800"
      >
        {spans.map((s, i) => {
          if (s.kind === 'plain') return <span key={i}>{s.text}</span>;
          const active = s.kind === 'active';
          return (
            <mark
              key={i}
              className={active ? 'hl-active cursor-pointer' : 'hl cursor-pointer'}
              data-active={active ? 'true' : 'false'}
              onClick={() => onSelect(s.findingIdx)}
              title="Click to select this finding"
            >
              {s.text}
            </mark>
          );
        })}
      </div>
    </section>
  );
}
