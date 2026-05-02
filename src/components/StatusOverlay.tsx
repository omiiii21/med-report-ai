type Props = {
  kind: 'parsing' | 'analyzing' | 'error';
  message?: string;
  fileName?: string;
  onDismiss?: () => void;
};

export function StatusOverlay({ kind, message, fileName, onDismiss }: Props) {
  if (kind === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
          <h3 className="text-sm font-semibold text-rose-900">Something went wrong</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-rose-800">{message}</p>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-4 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-700" />
        </span>
        <span className="text-sm text-slate-700">
          {kind === 'parsing'
            ? `Extracting text${fileName ? ` from ${fileName}` : ''}…`
            : 'Analyzing with AI…'}
        </span>
      </div>
    </div>
  );
}
