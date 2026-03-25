'use client';

import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

type ExportLog = {
  date: string;
  teamMember: string;
  category: string;
  durationHours: number;
  description: string;
  projectCode: string;
};

type ExportLogsButtonProps = {
  logs: ExportLog[];
};

export function ExportLogsButton({ logs }: ExportLogsButtonProps) {
  const onExport = () => {
    if (!logs.length) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'NhatKyCongViec');
    XLSX.writeFile(workbook, `nhat-ky-cong-viec-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={!logs.length}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download size={16} />
      Xuất nhật ký (.xlsx)
    </button>
  );
}
