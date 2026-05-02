import { useEffect, useState } from 'react';
import {
  DEFAULT_MODELS,
  KEY_HELP_URLS,
  KEY_PLACEHOLDERS,
  PROVIDERS,
  PROVIDER_LABELS,
  type Provider,
} from '../lib/llm';

type Props = {
  open: boolean;
  /** Active provider when the dialog opened. */
  initialProvider: Provider;
  /** Read a stored key for a given provider (sessionStorage). */
  getKeyFor: (p: Provider) => string;
  /** Read a stored model for a given provider (localStorage). */
  getModelFor: (p: Provider) => string;
  /** Save the active provider + that provider's key + model. */
  onSave: (provider: Provider, key: string, model: string) => void;
  /** Clear the stored key for a given provider. */
  onClear: (provider: Provider) => void;
  onClose: () => void;
};

export function KeyDialog({
  open,
  initialProvider,
  getKeyFor,
  getModelFor,
  onSave,
  onClear,
  onClose,
}: Props) {
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [key, setKey] = useState('');
  const [model, setModel] = useState('');
  const [reveal, setReveal] = useState(false);

  // When the dialog opens or the provider switches, reload from storage.
  useEffect(() => {
    if (!open) return;
    setProvider(initialProvider);
  }, [open, initialProvider]);

  useEffect(() => {
    if (!open) return;
    setKey(getKeyFor(provider));
    setModel(getModelFor(provider) || DEFAULT_MODELS[provider]);
    setReveal(false);
  }, [open, provider, getKeyFor, getModelFor]);

  if (!open) return null;

  const helpUrl = KEY_HELP_URLS[provider];
  const placeholder = KEY_PLACEHOLDERS[provider];
  const defaultModel = DEFAULT_MODELS[provider];
  const hasStoredKey = !!getKeyFor(provider);

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
            <h3 className="text-base font-semibold text-slate-900">AI provider settings</h3>
            <p className="mt-1 text-xs text-slate-500">
              Pick a provider and paste an API key. Keys live in your tab's sessionStorage and
              clear when the tab closes. The key is only ever sent to the provider you select.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Provider selector */}
        <div className="mt-4">
          <span className="text-xs font-medium text-slate-700">Provider</span>
          <div className="mt-1 inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={
                  'rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors ' +
                  (provider === p
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700')
                }
              >
                {PROVIDER_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">API key</span>
            <div className="mt-1 flex gap-2">
              <input
                type={reveal ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={placeholder}
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
                href={helpUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-700 underline hover:text-slate-900"
              >
                {helpUrl.replace(/^https?:\/\//, '')}
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
              Default for {PROVIDER_LABELS[provider]}:{' '}
              <code className="font-mono">{defaultModel}</code>.
            </p>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {hasStoredKey && (
            <button
              type="button"
              onClick={() => onClear(provider)}
              className="mr-auto rounded-md px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Clear {PROVIDER_LABELS[provider]} key
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
            onClick={() => onSave(provider, key.trim(), model.trim() || defaultModel)}
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
