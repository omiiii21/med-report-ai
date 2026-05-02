import { useEffect, useState } from 'react';
import { DEFAULT_MODEL } from '../lib/llm';

type Props = {
  open: boolean;
  initialKey: string;
  initialModel: string;
  onSave: (key: string, model: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function KeyDialog({ open, initialKey, initialModel, onSave, onClear, onClose }: Props) {
  const [key, setKey] = useState(initialKey);
  const [model, setModel] = useState(initialModel || DEFAULT_MODEL);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(initialKey);
      setModel(initialModel || DEFAULT_MODEL);
      setReveal(false);
    }
  }, [open, initialKey, initialModel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">OpenRouter API key</h3>
            <p className="mt-1 text-xs text-slate-500">
              Required for live analysis. Stored in your tab's sessionStorage and cleared when the tab closes. Never sent anywhere except OpenRouter.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">API key</span>
            <div className="mt-1 flex gap-2">
              <input
                type={reveal ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-or-..."
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="rounded-md border border-slate-300 px-3 text-xs text-slate-600 hover:bg-slate-50"
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Get one at{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-700 underline hover:text-slate-900"
              >
                openrouter.ai/keys
              </a>
              .
            </p>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">Model</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Any OpenRouter model identifier. Default: <code className="font-mono">{DEFAULT_MODEL}</code>.
            </p>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {initialKey && (
            <button
              type="button"
              onClick={onClear}
              className="mr-auto rounded-md px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Clear key
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(key.trim(), model.trim() || DEFAULT_MODEL)}
            disabled={!key.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
