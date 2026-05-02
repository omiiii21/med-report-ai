import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Use the legacy build for Node compatibility (no DOMMatrix etc.).
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

async function main() {
  const pdfPath = resolve('public/sample-report.pdf');
  const data = new Uint8Array(readFileSync(pdfPath));

  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as { str?: string }[])
      .map((item) => item.str ?? '')
      .join(' ');
    pages.push(pageText);
  }
  const decoded = pages
    .join('\n\n')
    .replace(/[-]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xf000));
  const raw = decoded.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  writeFileSync(resolve('scripts/sample-extracted.txt'), raw, 'utf8');
  console.log(`Extracted ${raw.length} chars to scripts/sample-extracted.txt`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
