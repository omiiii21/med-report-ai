import { useMemo } from 'react';
import type { ReportAnalysis } from '../lib/schema';
import { locatedFindings } from '../lib/highlight';
import { RawPanel } from './RawPanel';
import { InsightsPanel } from './InsightsPanel';

type Props = {
  raw: string;
  analysis: ReportAnalysis;
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
};

export function DualView({ raw, analysis, selectedIdx, onSelect }: Props) {
  const located = useMemo(() => locatedFindings(raw, analysis.tests), [raw, analysis.tests]);

  return (
    <div className="grid h-[calc(100vh-13rem)] min-h-[32rem] grid-cols-1 gap-4 lg:grid-cols-2">
      <RawPanel raw={raw} findings={analysis.tests} selectedIdx={selectedIdx} onSelect={onSelect} />
      <InsightsPanel
        findings={analysis.tests}
        located={located}
        selectedIdx={selectedIdx}
        onSelect={onSelect}
      />
    </div>
  );
}
