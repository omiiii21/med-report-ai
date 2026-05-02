type Props = {
  onOpenSettings: () => void;
  onReset: () => void;
  hasReport: boolean;
  apiKeyPresent: boolean;
};

export function Header({ onOpenSettings, onReset, hasReport, apiKeyPresent }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M12 4.5l7 3v5c0 4.5-3.1 7.5-7 8-3.9-.5-7-3.5-7-8v-5l7-3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 12h6M12 9v6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              Patient Report Simplifier
            </h1>
            <p className="text-xs text-slate-500">
              AI-generated interpretation. Based on a single report. Not medical advice.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasReport && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              New report
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span
              className={
                'h-2 w-2 rounded-full ' + (apiKeyPresent ? 'bg-emerald-500' : 'bg-slate-300')
              }
              aria-hidden
            />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
