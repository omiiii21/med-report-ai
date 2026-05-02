/**
 * Regenerates public/sample-analysis.json by parsing public/sample-report.pdf
 * and calling OpenRouter once. Run when the sample PDF or the prompt changes.
 *
 * Usage (PowerShell):
 *   $env:OPENROUTER_API_KEY="sk-or-..."; npm run precompute
 *
 * Usage (bash):
 *   OPENROUTER_API_KEY=sk-or-... npm run precompute
 *
 * Optional:
 *   OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { ReportAnalysis } from '../src/lib/schema';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, RETRY_NUDGE } from '../src/lib/prompts';

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';

async function extractText(pdfPath: string): Promise<string> {
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      (content.items as { str?: string }[]).map((item) => item.str ?? '').join(' ')
    );
  }
  return pages
    .join('\n\n')
    .replace(/[-]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xf000))
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function callLlm(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  temperature: number
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/omiiii21/med-report-ai',
      'X-Title': 'Patient Report Simplifier (precompute)',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty completion');
  return content;
}

function tryParse(s: string) {
  const cleaned = s.replace(/^```(?:json)?\s*([\s\S]*?)\s*```\s*$/, '$1').trim();
  return ReportAnalysis.safeParse(JSON.parse(cleaned));
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENROUTER_API_KEY env var.');
    process.exit(1);
  }
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const pdfPath = resolve('public/sample-report.pdf');
  console.log('Parsing', pdfPath);
  const raw = await extractText(pdfPath);
  console.log(`Extracted ${raw.length} chars.`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT_TEMPLATE(raw) },
  ];

  console.log('Calling', model);
  let completion = await callLlm(messages, apiKey, model, 0.1);
  let parsed = tryParse(completion);
  if (!parsed.success) {
    console.warn('Schema mismatch on first try, retrying once.');
    completion = await callLlm(
      [
        ...messages,
        { role: 'assistant', content: completion },
        { role: 'user', content: RETRY_NUDGE },
      ],
      apiKey,
      model,
      0
    );
    parsed = tryParse(completion);
  }
  if (!parsed.success) {
    console.error('Schema validation failed after retry:', parsed.error.issues);
    process.exit(1);
  }

  const verifiable = parsed.data.tests.filter((t) => raw.includes(t.source_snippet));
  console.log(
    `${verifiable.length}/${parsed.data.tests.length} findings have verbatim source_snippets.`
  );
  if (verifiable.length < parsed.data.tests.length) {
    console.warn(
      'WARNING: some source_snippets are not verbatim substrings; they will not highlight.'
    );
  }

  const out = resolve('public/sample-analysis.json');
  writeFileSync(out, JSON.stringify(parsed.data, null, 2) + '\n', 'utf8');
  console.log('Wrote', out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
