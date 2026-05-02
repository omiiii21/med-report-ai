import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function ShareCard() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use origin + path so query/hash don't leak into the QR.
      setUrl(window.location.origin + window.location.pathname);
    }
  }, []);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:gap-5">
      <div className="rounded-md bg-white p-2 ring-1 ring-slate-200">
        {url ? (
          <QRCodeSVG
            value={url}
            size={112}
            level="M"
            bgColor="#ffffff"
            fgColor="#0f172a"
            marginSize={1}
          />
        ) : (
          <div className="h-28 w-28 animate-pulse rounded bg-slate-100" />
        )}
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-sm font-semibold text-slate-900">Share this app</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Scan with your phone, or send the link to anyone you want to try it.
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
          <code className="max-w-[18rem] truncate rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
            {url || '…'}
          </code>
          <button
            type="button"
            onClick={copy}
            disabled={!url}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
