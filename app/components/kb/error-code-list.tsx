'use client';

import { useState } from 'react';
import { Search, Image as ImageIcon, X } from 'lucide-react';

type ErrorCode = {
  id: string;
  code: string;
  instrument: string;
  description: string;
  cause: string;
  solution: string;
  imageUrl: string | null;
  severity: string;
};

const SEVERITY_STYLE: Record<string, string> = {
  low: 'bg-slate-700/60 text-slate-700 dark:text-slate-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  high: 'bg-orange-500/20 text-orange-300',
  critical: 'bg-red-500/20 text-red-300',
};

const SEVERITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung Bình',
  high: 'Cao',
  critical: 'Nghiêm Trọng',
};

interface ErrorCodeListProps {
  errorCodes: ErrorCode[];
  instruments: string[];
  colorClass: string;
}

export function ErrorCodeList({ errorCodes, instruments, colorClass }: ErrorCodeListProps) {
  const [search, setSearch] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const filtered = errorCodes.filter((ec) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ec.code.toLowerCase().includes(q) ||
      ec.description.toLowerCase().includes(q) ||
      ec.cause.toLowerCase().includes(q) ||
      ec.solution.toLowerCase().includes(q);
    const matchInstrument = !filterInstrument || ec.instrument === filterInstrument;
    const matchSeverity = !filterSeverity || ec.severity === filterSeverity;
    return matchSearch && matchInstrument && matchSeverity;
  });

  const hasFilter = search || filterInstrument || filterSeverity;

  function clearFilters() {
    setSearch('');
    setFilterInstrument('');
    setFilterSeverity('');
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="glass-panel rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã lỗi, mô tả, nguyên nhân..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-slate-500 transition"
          />
        </div>
        <select
          value={filterInstrument}
          onChange={(e) => setFilterInstrument(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 text-sm text-white outline-none focus:border-slate-500 cursor-pointer"
        >
          <option value="">Tất cả thiết bị</option>
          {instruments.map((ins) => (
            <option key={ins} value={ins}>{ins}</option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 text-sm text-white outline-none focus:border-slate-500 cursor-pointer"
        >
          <option value="">Tất cả mức độ</option>
          <option value="low">Thấp</option>
          <option value="medium">Trung Bình</option>
          <option value="high">Cao</option>
          <option value="critical">Nghiêm Trọng</option>
        </select>
        {hasFilter && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-500 dark:text-slate-400">
            <span>{filtered.length} / {errorCodes.length} kết quả</span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-0.5 text-slate-600 dark:text-slate-500 hover:text-slate-300 transition"
              title="Xóa bộ lọc"
            >
              <X size={12} /> Xóa lọc
            </button>
          </div>
        )}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl px-8 py-14 text-center">
          <Search size={36} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-600 dark:text-slate-500 dark:text-slate-400">Không tìm thấy mã lỗi phù hợp.</p>
          {hasFilter && (
            <button onClick={clearFilters} className="mt-3 text-xs text-cyan-400 hover:underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {filtered.map((ec) => (
            <details key={ec.id} className="glass-panel rounded-xl group overflow-hidden">
              <summary className="p-4 flex cursor-pointer items-start justify-between gap-4 outline-none hover:bg-slate-800/40 transition list-none">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`font-mono text-lg font-bold ${colorClass}`}>{ec.code}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">{ec.instrument}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[ec.severity] ?? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {SEVERITY_LABEL[ec.severity] ?? ec.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white group-open:text-slate-300 transition-colors">{ec.description}</p>
                </div>
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 dark:text-slate-400 group-open:rotate-180 transition-transform">▼</div>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <div className="space-y-4 border-t border-slate-300/40 dark:border-slate-700/40 pt-4">
                  <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 px-4 py-3">
                    <p className="text-xs font-semibold text-orange-300 mb-1">⚠ Nguyên Nhân</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ec.cause}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-300 mb-1">✓ Quy trình xử lý đề xuất</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ec.solution}</p>
                  </div>
                  {ec.imageUrl && (
                    <div className="rounded-lg border border-slate-300/60 dark:border-slate-700/60 p-2 pl-3 pb-3">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                        <ImageIcon size={14} /> Hình Ảnh Minh Họa
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ec.imageUrl} alt="Ảnh minh họa" className="max-h-64 rounded bg-white/50 dark:bg-slate-900/50 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
