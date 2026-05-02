import type { TestFinding } from './schema';

export type Range = { start: number; end: number };
export type Span =
  | { kind: 'plain'; text: string }
  | { kind: 'hl'; text: string; findingIdx: number }
  | { kind: 'active'; text: string; findingIdx: number };

export function locate(raw: string, snippet: string): Range | null {
  if (!snippet) return null;

  // 1. Exact match.
  const exact = raw.indexOf(snippet);
  if (exact >= 0) return { start: exact, end: exact + snippet.length };

  // 2. Trimmed exact match (LLM sometimes trims the leading/trailing space).
  const trimmed = snippet.trim();
  if (trimmed && trimmed !== snippet) {
    const i = raw.indexOf(trimmed);
    if (i >= 0) return { start: i, end: i + trimmed.length };
  }

  // 3. Whitespace-collapsed match: build a map from "compact" indices back to
  //    original indices, then search the snippet (also compacted) inside it.
  const { compact, map } = collapseWhitespace(raw);
  const compactSnippet = trimmed.replace(/\s+/g, ' ');
  const j = compact.indexOf(compactSnippet);
  if (j >= 0) {
    const start = map[j];
    const endCompact = j + compactSnippet.length - 1;
    const end = map[Math.min(endCompact, map.length - 1)] + 1;
    return { start, end };
  }

  return null;
}

function collapseWhitespace(s: string): { compact: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];
  let prevSpace = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      if (!prevSpace) {
        out.push(' ');
        map.push(i);
        prevSpace = true;
      }
    } else {
      out.push(ch);
      map.push(i);
      prevSpace = false;
    }
  }
  return { compact: out.join(''), map };
}

export function buildSpans(
  raw: string,
  findings: TestFinding[],
  selectedIdx: number | null
): Span[] {
  // Locate each finding's snippet, drop misses.
  type Hit = Range & { findingIdx: number };
  const hits: Hit[] = [];
  findings.forEach((f, idx) => {
    const r = locate(raw, f.source_snippet);
    if (r && r.end > r.start) hits.push({ ...r, findingIdx: idx });
  });

  // Sort by start, then merge overlaps. Selected finding wins on overlap.
  hits.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Hit[] = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h.start < last.end) {
      const selectedHere = h.findingIdx === selectedIdx;
      const selectedLast = last.findingIdx === selectedIdx;
      if (selectedHere && !selectedLast) {
        merged[merged.length - 1] = { ...h, start: last.start, end: Math.max(last.end, h.end) };
      } else {
        last.end = Math.max(last.end, h.end);
      }
      continue;
    }
    merged.push({ ...h });
  }

  const spans: Span[] = [];
  let cursor = 0;
  for (const h of merged) {
    if (cursor < h.start) {
      spans.push({ kind: 'plain', text: raw.slice(cursor, h.start) });
    }
    const text = raw.slice(h.start, h.end);
    if (h.findingIdx === selectedIdx) {
      spans.push({ kind: 'active', text, findingIdx: h.findingIdx });
    } else {
      spans.push({ kind: 'hl', text, findingIdx: h.findingIdx });
    }
    cursor = h.end;
  }
  if (cursor < raw.length) {
    spans.push({ kind: 'plain', text: raw.slice(cursor) });
  }
  return spans;
}

export function locatedFindings(raw: string, findings: TestFinding[]): boolean[] {
  return findings.map((f) => locate(raw, f.source_snippet) !== null);
}
