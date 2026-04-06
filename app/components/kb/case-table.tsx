'use client';

import { useState } from 'react';
import { updateCaseStatus } from '@/app/actions-kb';
import { CaseImageGallery } from './case-image-gallery';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-orange-500/20 text-orange-300',
  resolved: 'bg-emerald-500/20 text-emerald-300',
  escalated: 'bg-red-500/20 text-red-300',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  escalated: 'Leo thang',
};

type SupportCase = {
  id: string;
  caseDate: Date;
  customer: string;
  instrument: string;
  issueType: string;
  description: string;
  content: string | null;
  resolution: string | null;
  handler: string;
  status: string;
  attachmentUrl: string | null;
  imageUrls: string[];
};

type SortField = 'caseDate' | 'status';
type SortDir = 'asc' | 'desc';

interface CaseTableProps {
  cases: SupportCase[];
  colorClass: string;
  focusBorderClass: string;
}

function renderContent(content?: string | null, resolution?: string | null) {
  const value = content?.trim() || resolution?.trim() || '';
  if (!value) return null;
  if (/^[\s]*<[a-zA-Z]/.test(value)) {
    return (
      <div
        className="rich-content mt-3 text-slate-800 dark:text-slate-200"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }
  return (
    <div className="mt-3 space-y-2">
      {value.split('\n').map((line, i) =>
        line.trim() === '' ? <br key={i} /> : (
          <p key={i} className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{line}</p>
        )
      )}
    </div>
  );
}

function SortBtn({ field, current, dir, onClick }: { field: SortField; current: SortField; dir: SortDir; onClick: () => void }) {
  const active = current === field;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-0.5 hover:text-gray-900 dark:text-white transition"
    >
      {field === 'caseDate' ? 'Ngày / Khách' : 'Trạng Thái'}
      {active ? (
        dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
      ) : (
        <ChevronDown size={12} className="opacity-30" />
      )}
    </button>
  );
}

export function CaseTable({ cases, colorClass: _colorClass, focusBorderClass }: CaseTableProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<SortField>('caseDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const hasFilter = search || filterStatus;

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function clearFilters() { setSearch(''); setFilterStatus(''); }

  const filtered = cases
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.customer.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.handler.toLowerCase().includes(q) ||
        c.instrument.toLowerCase().includes(q);
      const matchStatus = !filterStatus || c.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'caseDate') {
        cmp = new Date(a.caseDate).getTime() - new Date(b.caseDate).getTime();
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

  return (
    <div className="space-y-3">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 glass-panel rounded-xl px-4 py-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm khách hàng, thiết bị, người xử lý..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-slate-500 transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 text-sm text-white outline-none focus:border-slate-500 cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="open">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="escalated">Leo thang</option>
        </select>
        {hasFilter && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-600">
            <span>{filtered.length} / {cases.length} case</span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-0.5 text-slate-600 dark:text-slate-600 hover:text-slate-300 transition"
            >
              <X size={12} /> Xóa lọc
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="glass-panel overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium cursor-pointer">
                <SortBtn field="caseDate" current={sortField} dir={sortDir} onClick={() => toggleSort('caseDate')} />
              </th>
              <th className="px-5 py-4 font-medium">Vấn Đề / Thiết Bị</th>
              <th className="px-5 py-4 font-medium">Người Xử Lý</th>
              <th className="px-5 py-4 font-medium whitespace-nowrap cursor-pointer">
                <SortBtn field="status" current={sortField} dir={sortDir} onClick={() => toggleSort('status')} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-600 dark:text-slate-600 font-medium">
                  {hasFilter ? 'Không tìm thấy case phù hợp.' : 'Chưa có case hỗ trợ nào.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium text-gray-900 dark:text-white">{new Date(c.caseDate).toLocaleDateString('vi-VN')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">{c.customer}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{c.description}</p>
                    <p className="mt-1 text-xs">
                      <span className="text-slate-500 dark:text-slate-600">{c.instrument}</span> • <span className="text-slate-600 dark:text-slate-600">{c.issueType}</span>
                    </p>
                    {renderContent(c.content, c.resolution)}
                    {c.imageUrls.length > 0 && (
                      <CaseImageGallery imageUrls={c.imageUrls} title={c.description} />
                    )}
                    {c.attachmentUrl && (
                      <a
                        href={c.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-xs text-cyan-400 bg-cyan-400/10 inline-block px-2 py-1 rounded hover:underline"
                      >
                        📎 Mở tài liệu đính kèm
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top font-medium text-slate-700 dark:text-slate-300">{c.handler}</td>
                  <td className="px-5 py-4 align-top">
                    <form action={updateCaseStatus} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <select
                        name="status"
                        defaultValue={c.status}
                        onChange={(e) => e.target.form?.requestSubmit()}
                        className={`cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-200 dark:ring-slate-700 hover:ring-slate-600 focus:ring-slate-500 ${STATUS_STYLE[c.status]}`}
                      >
                        {Object.entries(STATUS_LABEL).map(([val, label]) => (
                          <option key={val} value={val} className="bg-slate-100 dark:bg-slate-800 text-white">
                            {label}
                          </option>
                        ))}
                      </select>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
