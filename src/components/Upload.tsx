import { useRef, useState } from 'react';

type Props = {
  onFile: (file: File) => void;
  onTrySample: () => void;
  busy: boolean;
};

export function Upload({ onFile, onTrySample, busy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={
          'rounded-2xl border-2 border-dashed bg-white p-8 text-center transition-colors sm:p-12 ' +
          (drag ? 'border-slate-900 bg-slate-50' : 'border-slate-300')
        }
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Upload a medical report</h2>
        <p className="mt-1 text-sm text-slate-500">
          Drag a PDF, DOCX, or TXT file here, or click to browse. Files never leave your browser.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Choose file
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onTrySample}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Try sample report
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <ul className="mt-6 space-y-1 text-xs text-slate-500">
        <li>• Supported: text-based PDFs, DOCX, plain text. OCR for scanned images is not supported in this version.</li>
        <li>• Your OpenRouter API key (if used) stays in your browser session and is never sent anywhere except OpenRouter.</li>
        <li>• The sample report works offline using a precomputed analysis — no API key required.</li>
      </ul>
    </div>
  );
}
