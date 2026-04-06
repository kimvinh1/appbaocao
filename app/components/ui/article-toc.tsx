'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import type { TocItem } from '@/lib/html-toc';

interface ArticleTocProps {
  headings: TocItem[];
}

export function ArticleToc({ headings }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [open, setOpen] = useState(false);

  // Scroll-spy bằng IntersectionObserver
  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <>
      {/* Desktop: sticky sidebar bên phải — hiển thị ở màn hình ≥ xl */}
      <aside className="hidden xl:block fixed right-6 top-24 w-56 z-20">
        <div className="glass-panel rounded-xl px-4 py-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <List size={12} /> Mục lục
          </p>
          <nav className="space-y-1">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveId(h.id);
                }}
                className={[
                  'block truncate rounded px-2 py-1 transition-colors text-xs leading-snug',
                  h.level === 3 ? 'pl-4' : '',
                  activeId === h.id
                    ? 'bg-cyan-500/15 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                ].join(' ')}
                title={h.text}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile: collapsible panel ở đầu bài */}
      <div className="xl:hidden glass-panel rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-slate-300 hover:text-white transition"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <List size={14} /> Mục lục ({headings.length} mục)
          </span>
          <span className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {open && (
          <nav className="border-t border-slate-700/50 px-4 py-3 space-y-1">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setOpen(false);
                }}
                className={[
                  'block text-sm py-1 transition-colors',
                  h.level === 3 ? 'pl-4 text-xs' : '',
                  activeId === h.id ? 'text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                {h.level === 2 ? '· ' : '  – '}{h.text}
              </a>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
