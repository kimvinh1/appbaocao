'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

type Project = {
  id: string;
  code: string;
  clientName: string;
  instrument: string;
  panelType: string;
  status: string;
  salesPerson?: string;
  appPerson?: string;
  createdAt: Date;
  projectLogs: {
    id: string;
    note: string;
    status: string;
    updatedBy: string;
    createdAt: Date;
  }[];
};

type Status = { value: string; label: string; color: string };

function statusBadge(value: string, statuses: Status[]) {
  const found = statuses.find((s) => s.value === value);
  const color = found?.color ?? 'bg-slate-600 text-slate-200';
  return `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`;
}

const INPUT_CLS = 'w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400';

export function ProjectsTable({ projects, statuses }: { projects: Project[]; statuses: Status[] }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('');
  const [filterApp, setFilterApp] = useState('');
  const [filterSales, setFilterSales] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      // Mặc định ẩn dự án Lưu Trữ khỏi chế độ xem tất cả
      if (filterStatus === 'all' && p.status === 'Lưu trữ') return false;

      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterClient && !p.clientName.toLowerCase().includes(filterClient.toLowerCase())) return false;
      if (filterApp && !(p.appPerson ?? '').toLowerCase().includes(filterApp.toLowerCase())) return false;
      if (filterSales && !(p.salesPerson ?? '').toLowerCase().includes(filterSales.toLowerCase())) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(p.createdAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(p.createdAt) > to) return false;
      }
      return true;
    });
  }, [projects, filterStatus, filterClient, filterApp, filterSales, dateFrom, dateTo]);

  const hasFilter = filterStatus !== 'all' || filterClient || filterApp || filterSales || dateFrom || dateTo;

  function clearFilters() {
    setFilterStatus('all');
    setFilterClient('');
    setFilterApp('');
    setFilterSales('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <section className="space-y-3">
      {/* Filter bar */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Search size={14} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Lọc dự án</span>
          {hasFilter && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
              <X size={12} /> Xoá bộ lọc
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={INPUT_CLS}>
            <option value="all">-- Tất cả trạng thái --</option>
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input
            value={filterClient} onChange={(e) => setFilterClient(e.target.value)}
            placeholder="Tìm khách hàng..." className={INPUT_CLS}
          />
          <input
            value={filterApp} onChange={(e) => setFilterApp(e.target.value)}
            placeholder="App phụ trách..." className={INPUT_CLS}
          />
          <input
            value={filterSales} onChange={(e) => setFilterSales(e.target.value)}
            placeholder="PS/Sales..." className={INPUT_CLS}
          />
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500">Từ ngày</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className={INPUT_CLS} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500">Đến ngày</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className={INPUT_CLS} />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Hiển thị <span className="text-cyan-400 font-medium">{filtered.length}</span> / {projects.length} dự án
        </p>
      </div>

      {/* Table */}
      <div className="table-shell">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã dự án</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Máy giải</th>
              <th className="px-4 py-3">Panel</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">PS/Sales</th>
              <th className="px-4 py-3">App</th>
              <th className="px-4 py-3">Log gần nhất</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => {
              const lastLog = project.projectLogs[0];
              return (
                <tr key={project.id} className="border-t border-slate-800/80 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono font-medium text-cyan-300">{project.code}</td>
                  <td className="px-4 py-3 text-white">{project.clientName}</td>
                  <td className="px-4 py-3 text-slate-300">{project.instrument || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{project.panelType}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(project.status, statuses)}>{project.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{project.salesPerson || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{project.appPerson || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px]">
                    {lastLog ? (
                      <div>
                        <span className="text-slate-300">{lastLog.updatedBy}</span>
                        {' · '}
                        <span>{new Date(lastLog.createdAt).toLocaleDateString('vi-VN')}</span>
                        <br />
                        <span className="text-slate-500 italic line-clamp-1">{lastLog.note}</span>
                      </div>
                    ) : <span className="text-slate-600 italic">Chưa có log</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${project.id}`}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-cyan-500 hover:text-slate-950 whitespace-nowrap">
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                  {hasFilter ? 'Không có dự án nào khớp với bộ lọc.' : 'Chưa có dự án nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
