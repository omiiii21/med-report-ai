import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export type ParseResult = {
  text: string;
  parseMs: number;
};

export async function extractText(file: File): Promise<ParseResult> {
  const t0 = performance.now();
  const name = file.name.toLowerCase();

  let raw: string;
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    raw = await extractPdf(await file.arrayBuffer());
  } else if (
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    raw = await extractDocx(await file.arrayBuffer());
  } else if (name.endsWith('.txt') || file.type.startsWith('text/')) {
    raw = await file.text();
  } else {
    throw new Error(
      `Unsupported file type: ${file.name} (${file.type || 'unknown'}). Use .pdf, .docx, or .txt.`
    );
  }

  return { text: normalize(raw), parseMs: performance.now() - t0 };
}

async function extractPdf(buf: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const doc = await loadingTask.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
  }
  return pages.join('\n\n');
}

async function extractDocx(buf: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

function normalize(s: string): string {
  return decodePrivateUse(s)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Some PDFs (notably certain Indian lab-report generators) encode glyphs in the
// Unicode Private Use Area as 0xF000 + ASCII. Map those back to the corresponding
// ASCII characters so the text becomes searchable / LLM-readable.
function decodePrivateUse(s: string): string {
  return s.replace(/[-]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xf000)
  );
}
