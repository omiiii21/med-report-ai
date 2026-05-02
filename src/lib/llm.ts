import { ReportAnalysis } from './schema';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, RETRY_NUDGE } from './prompts';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';

export type AnalyzeOptions = {
  apiKey: string;
  model?: string;
  signal?: AbortSignal;
};

export type AnalyzeResult = {
  analysis: ReportAnalysis;
  llmMs: number;
  model: string;
};

export async function analyzeReport(
  rawText: string,
  opts: AnalyzeOptions
): Promise<AnalyzeResult> {
  const model = opts.model ?? DEFAULT_MODEL;
  const t0 = performance.now();

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT_TEMPLATE(rawText) },
  ];

  let raw = await call(messages, opts.apiKey, model, 0.1, opts.signal);
  let parsed = tryParse(raw);

  if (!parsed.ok) {
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: RETRY_NUDGE },
    ];
    raw = await call(retryMessages, opts.apiKey, model, 0, opts.signal);
    parsed = tryParse(raw);
    if (!parsed.ok) {
      throw new Error(
        `LLM returned an invalid response after retry. ${parsed.reason}`
      );
    }
  }

  return {
    analysis: parsed.data,
    llmMs: performance.now() - t0,
    model,
  };
}

async function call(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  temperature: number,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer':
        typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
      'X-Title': 'Patient Report Simplifier',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `OpenRouter error ${res.status}: ${text.slice(0, 300) || res.statusText}`
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned an empty response.');
  return content;
}

type Parsed =
  | { ok: true; data: ReportAnalysis }
  | { ok: false; reason: string };

function tryParse(raw: string): Parsed {
  const cleaned = stripFences(raw).trim();
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (e) {
    return { ok: false, reason: `Not valid JSON: ${(e as Error).message}` };
  }
  const result = ReportAnalysis.safeParse(json);
  if (!result.success) {
    return { ok: false, reason: result.error.issues.map((i) => i.message).join('; ') };
  }
  return { ok: true, data: result.data };
}

function stripFences(s: string): string {
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```\s*$/);
  return fence ? fence[1] : s;
}
