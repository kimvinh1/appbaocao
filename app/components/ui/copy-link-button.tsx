'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    // Nếu là path (bắt đầu bằng /), ghép với origin
    const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback cho môi trường không hỗ trợ clipboard API
      const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
      const el = document.createElement('input');
      el.value = fullUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Đã sao chép!' : 'Sao chép link'}
      className={className ?? `inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-700 hover:text-white transition`}
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Đã sao chép' : 'Copy link'}
    </button>
  );
}
