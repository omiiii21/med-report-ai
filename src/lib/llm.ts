import { ReportAnalysis } from './schema';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, RETRY_NUDGE } from './prompts';

export type Provider = 'openrouter' | 'gemini';

export const PROVIDERS: Provider[] = ['openrouter', 'gemini'];

export const PROVIDER_LABELS: Record<Provider, string> = {
  openrouter: 'OpenRouter',
  gemini: 'Google Gemini',
};

export const DEFAULT_MODELS: Record<Provider, string> = {
  openrouter: 'anthropic/claude-sonnet-4.5',
  gemini: 'gemini-2.5-flash',
};

export const KEY_HELP_URLS: Record<Provider, string> = {
  openrouter: 'https://openrouter.ai/keys',
  gemini: 'https://aistudio.google.com/app/apikey',
};

export const KEY_PLACEHOLDERS: Record<Provider, string> = {
  openrouter: 'sk-or-...',
  gemini: 'AIza...',
};

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export type AnalyzeOptions = {
  provider: Provider;
  apiKey: string;
  model?: string;
  signal?: AbortSignal;
};

export type AnalyzeResult = {
  analysis: ReportAnalysis;
  llmMs: number;
  model: string;
  provider: Provider;
};

export async function analyzeReport(
  rawText: string,
  opts: AnalyzeOptions
): Promise<AnalyzeResult> {
  const model = (opts.model && opts.model.trim()) || DEFAULT_MODELS[opts.provider];
  const t0 = performance.now();

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT_TEMPLATE(rawText) },
  ];

  let raw = await callProvider(messages, opts.provider, opts.apiKey, model, 0.1, opts.signal);
  let parsed = tryParse(raw);

  if (!parsed.ok) {
    const retryMessages: Message[] = [
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: RETRY_NUDGE },
    ];
    raw = await callProvider(retryMessages, opts.provider, opts.apiKey, model, 0, opts.signal);
    parsed = tryParse(raw);
    if (!parsed.ok) {
      throw new Error(`LLM returned an invalid response after retry. ${parsed.reason}`);
    }
  }

  return {
    analysis: parsed.data,
    llmMs: performance.now() - t0,
    model,
    provider: opts.provider,
  };
}

async function callProvider(
  messages: Message[],
  provider: Provider,
  apiKey: string,
  model: string,
  temperature: number,
  signal?: AbortSignal
): Promise<string> {
  if (provider === 'gemini') {
    return callGemini(messages, apiKey, model, temperature, signal);
  }
  return callOpenRouter(messages, apiKey, model, temperature, signal);
}

async function callOpenRouter(
  messages: Message[],
  apiKey: string,
  model: string,
  temperature: number,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

async function callGemini(
  messages: Message[],
  apiKey: string,
  model: string,
  temperature: number,
  signal?: AbortSignal
): Promise<string> {
  // Gemini API uses a separate `systemInstruction` field instead of a
  // system-role message inside `contents`. Translate accordingly.
  const systemParts: string[] = [];
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content);
    } else {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      });
    }
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature,
    },
  };
  if (systemParts.length) {
    body.systemInstruction = { parts: [{ text: systemParts.join('\n').trim() }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Gemini error ${res.status}: ${text.slice(0, 300) || res.statusText}`
    );
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the request: ${data.promptFeedback.blockReason}`);
  }
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

type Parsed = { ok: true; data: ReportAnalysis } | { ok: false; reason: string };

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

// Backward-compat default for any existing callers (App.tsx imports DEFAULT_MODEL).
export const DEFAULT_MODEL = DEFAULT_MODELS.openrouter;
