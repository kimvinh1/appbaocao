'use client';

import { useState, useMemo, useTransition } from 'react';
import { Copy, Check, ExternalLink, Trash2, Search, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { deleteResourceLink } from '@/app/actions-resources';
import { RESOURCE_MODULES } from '@/lib/resource-constants';

type ResourceLink = {
  id: string;
  module: string;
  category: string;
  title: string;
  url: string;
  description: string | null;
  tags: string;
  createdBy: string;
  createdAt: Date;
};

const MODULE_LABEL: Record<string, string> = {
  chung: 'Chung',
  illumina: 'Illumina',
  'vi-sinh': 'Vi Sinh',
  cepheid: 'Cepheid / SBPM',
};

const MODULE_COLOR: Record<string, string> = {
  chung:    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  illumina: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
  'vi-sinh':'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
  cepheid:  'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
};

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
      title="Copy link"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? 'Đã copy' : 'Copy link'}
    </button>
  );
}

function DeleteButton({ id, isOwner }: { id: string; isOwner: boolean }) {
  const [pending, startTransition] = useTransition();
  if (!isOwner) return null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm('Xoá link này?')) return;
        const fd = new FormData();
        fd.append('id', id);
        startTransition(() => deleteResourceLink(fd));
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50"
        title="Xoá"
      >
        <Trash2 size={12} /> {pending ? '...' : 'Xoá'}
      </button>
    </form>
  );
}

export function ResourceLibrary({
  links,
  currentUserName,
  isAdmin,
}: {
  links: ResourceLink[];
  currentUserName: string;
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState('');
  const [activeModule, setActiveModule] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return links.filter((l) => {
      const matchModule = activeModule === 'all' || l.module === activeModule;
      if (!matchModule) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        (l.description?.toLowerCase().includes(q) ?? false) ||
        l.tags.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
      );
    });
  }, [links, query, activeModule]);

  // Group by module → category
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, ResourceLink[]>>();
    for (const link of filtered) {
      if (!map.has(link.module)) map.set(link.module, new Map());
      const catMap = map.get(link.module)!;
      if (!catMap.has(link.category)) catMap.set(link.category, []);
      catMap.get(link.category)!.push(link);
    }
    return map;
  }, [filtered]);

  const moduleOrder = ['chung', 'illumina', 'vi-sinh', 'cepheid'];

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên, mô tả, tag..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-400 transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Module filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveModule('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition ${activeModule === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Tất cả
          </button>
          {RESOURCE_MODULES.map((m) => (
            <button
              key={m.value}
              onClick={() => setActiveModule(m.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${activeModule === m.value ? MODULE_COLOR[m.value] + ' !border-current' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Link
          href="/tai-lieu/moi"
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 transition ml-auto"
        >
          <Plus size={15} /> Thêm Link
        </Link>
      </div>

      {/* ── Results count ── */}
      {query && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length === 0 ? 'Không tìm thấy kết quả nào' : `${filtered.length} kết quả cho "${query}"`}
        </p>
      )}

      {/* ── Empty state ── */}
      {links.length === 0 && (
        <div className="glass-panel rounded-2xl py-16 text-center">
          <p className="text-3xl mb-3">🔗</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">Chưa có link nào</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Thêm link tài liệu đầu tiên để chia sẻ với nhóm.</p>
          <Link href="/tai-lieu/moi" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-5 py-2.5 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 transition">
            <Plus size={15} /> Thêm Link Đầu Tiên
          </Link>
        </div>
      )}

      {/* ── Grouped list ── */}
      {moduleOrder
        .filter((m) => grouped.has(m))
        .map((moduleKey) => {
          const catMap = grouped.get(moduleKey)!;
          const modulePill = MODULE_COLOR[moduleKey] ?? MODULE_COLOR.chung;
          return (
            <section key={moduleKey} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${modulePill}`}>
                  {MODULE_LABEL[moduleKey] ?? moduleKey}
                </span>
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </h2>

              {Array.from(catMap.entries()).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                    {cat} · {items.length}
                  </p>
                  <div className="space-y-2">
                    {items.map((link) => {
                      const canEdit = isAdmin || link.createdBy === currentUserName;
                      return (
                        <div
                          key={link.id}
                          className="glass-panel rounded-xl px-4 py-3 flex items-start gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
                        >
                          {/* Icon */}
                          <div className="mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-1.5 shrink-0">
                            <ExternalLink size={14} className="text-slate-500 dark:text-slate-400" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition truncate block"
                            >
                              {link.title} ↗
                            </a>
                            {link.description && (
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {link.description}
                              </p>
                            )}
                            {link.tags && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {link.tags.split(',').filter(Boolean).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-slate-500 dark:text-slate-400"
                                  >
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              <ExternalLink size={12} /> Mở
                            </a>
                            <CopyButton url={link.url} />
                            {canEdit && <DeleteButton id={link.id} isOwner={canEdit} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
    </div>
  );
}
